package com.sgifbackend.services;
 
import com.sgifbackend.models.Dossier;
import com.sgifbackend.models.DossierImport;
import com.sgifbackend.models.Notification;
import com.sgifbackend.repositories.DossierImportRepository;
import com.sgifbackend.repositories.NotificationRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
 
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
 
/**
 * Service d'importation du fichier Excel CCR (Comptabilité Client & Recouvrement).
 *
 * Structure attendue du fichier .xlsx (ligne 1 = en-têtes) :
 *   Col A : IP Patient
 *   Col B : Bénéficiaire
 *   Col C : CIN
 *   Col D : Date début séjour
 *   Col E : Date fin séjour
 *   Col F : Numéro Facture
 *   Col G : Montant
 *   Col H : Paiement
 *   Col I : RAP (Reste À Payer)
 *
 * Pour chaque ligne valide :
 *   1. Crée un enregistrement dans dossiers_importes (données brutes)
 *   2. Crée automatiquement un Dossier avec statut IMPORTE_CCR
 */

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ImportationService {
 
    private final DossierImportRepository importRepo;
    private final DossierService          dossierService;
    private final NotificationRepository notificationRepository; 
    /**
     * Importe un fichier Excel CCR et crée les dossiers correspondants.
     *
     * @param fichier fichier .xlsx transmis par la CCR
     * @param auteur  username de l'agent (extrait du JWT par le contrôleur)
     * @return Map { importes, doublons, erreurs, details }
     */
    public Map<String, Object> importerFichierCcr(MultipartFile fichier,
                                                   String auteur) throws IOException {
        int importes = 0, doublons = 0, erreurs = 0;
        List<String> details = new ArrayList<>();
        List<Long> idsDossiersCrees = new ArrayList<>();
        
        
        try (Workbook wb = new XSSFWorkbook(fichier.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
 
            // Ligne 0 = en-têtes → on commence à 1
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || estVide(row)) continue;
 
                try {
                    String ip      = lireTexte(row, 0);
                    String facture = lireTexte(row, 5);
                    
                    if (ip.isBlank() || facture.isBlank()) {
                        erreurs++;
                        details.add("Ligne " + (i+1) + " : IP ou numéro de facture manquant");
                        continue;
                    }
 
                    if (importRepo.existsByIpAndNumeroFacture(ip, facture)) {
                        doublons++;
                        log.info("Doublon ignoré : IP={}, facture={}", ip, facture);
                        notificationRepository.save(Notification.builder()
                        	    .message("Doublon ignoré : IP=" + ip + ", facture=" + facture)
                        	    .type("DOUBLON_IMPORT")
                        	    .idDossier(null)
                        	    .lu(false)
                        	    .build());
                        
                        details.add("Ligne " + (i+1) + " : doublon ignoré (IP=" + ip + ")"); // optionnel
                        continue;
                    }
 
                    // Enregistrement données brutes CCR
                    DossierImport di = new DossierImport();
                    di.setIp(ip);
                    di.setBeneficiaire(lireTexte(row, 1));
                    di.setCin(lireTexte(row, 2));
                    di.setDateD(lireDate(row, 3));
                    di.setDateF(lireDate(row, 4));
                    di.setNumeroFacture(facture);
                    di.setMontant(lireDecimal(row, 6));
                    di.setPaiement(lireDecimal(row, 7));
                    di.setRap(lireDecimal(row, 8));
                    
                    
                    di.setRelance1(lireLong(row, 9));
                    di.setDateRelance1(lireDateAsDate(row, 10));
                    di.setRelance2(lireLong(row, 11));
                    di.setDateRelance2(lireDateAsDate(row, 12));
                    di.setObservation(lireTexte(row, 13));
                    
                    importRepo.save(di);
 
                    // Création automatique du dossier juridique (statut IMPORTE_CCR)
                    Dossier d = new Dossier();
                    d.setIp(ip);
                    d.setNumeroFacture(facture);
                    d.setBeneficiaire(di.getBeneficiaire());
                    d.setCin(di.getCin());
                    Dossier dossierCree = dossierService.creerDepuisImport(d, auteur);
                    if (dossierCree != null) {
                        idsDossiersCrees.add(dossierCree.getIdDossier());
                    }
                    importes++;
                }catch (Exception e) {
                    erreurs++;
                    details.add("Ligne " + (i+1) + " : erreur — " + e.getMessage());
                    log.warn("Erreur import ligne {} : {}", i+1, e.getMessage());
                }
            }
        }
 
        log.info("Import CCR : {} importés, {} doublons, {} erreurs", importes, doublons, erreurs);
 
        Map<String, Object> rapport = new HashMap<>();
        rapport.put("importes", importes);
        rapport.put("doublons", doublons);
        rapport.put("erreurs",  erreurs);
        rapport.put("details",  details);
        rapport.put("ids", idsDossiersCrees);
        return rapport;
    }
 
    // ── Helpers Apache POI ──────────────────────────────────────────────────
    
    
    private boolean estVide(Row row) {
        for (int i = row.getFirstCellNum(); i < row.getLastCellNum(); i++) {
            Cell c = row.getCell(i);
            if (c != null && c.getCellType() != CellType.BLANK && !c.toString().isBlank())
                return false;
        }
        return true;
    }	
	
    
 
    private String lireTexte(Row row, int col) {
        Cell c = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (c == null) return "";
        return switch (c.getCellType()) {
            case STRING  -> c.getStringCellValue().trim();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(c))
                    yield c.getLocalDateTimeCellValue().toLocalDate().toString();
                double v = c.getNumericCellValue();
                yield (v == Math.floor(v)) ? String.valueOf((long) v) : String.valueOf(v);
            }
            case BOOLEAN -> String.valueOf(c.getBooleanCellValue());
            default      -> c.toString().trim();
        };
    }
 
    private LocalDate lireDate(Row row, int col) {
        Cell c = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (c == null) return null;
        try {
            if (c.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(c)) {
                return c.getDateCellValue().toInstant()
                    .atZone(ZoneId.systemDefault()).toLocalDate();
            }
            return LocalDate.parse(c.getStringCellValue().trim());
        } catch (Exception e) { return null; }
    }
 
    /* 
    private BigDecimal lireDecimal(Row row, int col) {
        Cell c = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (c == null) return BigDecimal.ZERO;
        
        DataFormatter formatter = new DataFormatter();
        String valeur = formatter.formatCellValue(c).trim();
        if (valeur.isEmpty()) return BigDecimal.ZERO;
        
        // Supprimer tous les espaces (y compris insécables) et remplacer la virgule par un point
        String normalisee = valeur.replaceAll("\\s+", "").replace(',', '.');
        try {
            return new BigDecimal(normalisee);
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }
    Version 2 quasi parfaite mais manque la virgule*/
    private BigDecimal lireDecimal(Row row, int col) {
        Cell c = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (c == null) return BigDecimal.ZERO;
        try {
            if (c.getCellType() == CellType.NUMERIC) {
                return BigDecimal.valueOf(c.getNumericCellValue());
            } else if (c.getCellType() == CellType.STRING) {
                String val = c.getStringCellValue().trim()
								                		.replaceAll("\\s+", "")   // supprime tous les caractères blancs (espaces, insécables, etc.)
								                		.replace(',', '.');
                return new BigDecimal(val);
            }
        } catch (Exception e) { }
        return BigDecimal.ZERO;
    }
 
    private long lireLong(Row row, int col) {
        String val = lireTexte(row, col);
        if (val == null || val.isBlank()) return 0L;
        try {
            return Long.parseLong(val.trim());
        } catch (NumberFormatException e) {
            return 0L;
        }
    }

    private Date lireDateAsDate(Row row, int col) {
        LocalDate localDate = lireDate(row, col);
        if (localDate == null) return null;
        return Date.from(localDate.atStartOfDay(ZoneId.systemDefault()).toInstant());
    }
    
    
   
	
}	
	