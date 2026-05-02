package com.sgifbackend.services;

import com.sgifbackend.models.Dossier;
import com.sgifbackend.models.DossierImport;
import com.sgifbackend.repositories.DossierImportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
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
/*
    private final DossierImportRepository importRepo;
    private final DossierService          dossierService;
*/
    /* Importe un fichier Excel CCR.
    
      @param fichier fichier .xlsx transmis par la CCR
      @param auteur  nom de l'agent qui effectue l'import (depuis le JWT)
      @return Map contenant : importes, doublons, erreurs, details
     */
/*    public Map<String, Object> importerFichierCcr(MultipartFile fichier, String auteur) throws IOException {

        int importes = 0, doublons = 0, erreurs = 0;
        List<String> details = new ArrayList<>();

        try (Workbook wb = new XSSFWorkbook(fichier.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);

            // La ligne 0 contient les en-têtes — on commence à la ligne 1
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || estVide(row)) continue;

                try {
                    String ip      = lireTexte(row, 0);
                    String facture = lireTexte(row, 5);

                    if (ip.isBlank() || facture.isBlank()) {
                        erreurs++;
                        details.add("Ligne " + (i + 1) + " : IP ou numéro de facture manquant");
                        continue;
                    }

                    // Doublon dans dossiers_importes ?
                    if (importRepo.existsByIpAndNumeroFacture(ip, facture)) {
                        doublons++;
                        details.add("Ligne " + (i + 1) + " : doublon ignoré (IP=" + ip + ", Facture=" + facture + ")");
                        continue;
                    }

                    //Enregistrement des données brutes CCR 
                    DossierImport di = new DossierImport();
                    di.setIp(ip);
                    di.setBeneficiaire(lireTexte(row, 1));
                    di.setCin(lireTexte(row, 2));
                    di.setDateD(lireDate(row, 3));
                    di.setDateF(lireDate(row, 4));
                    di.setNumeroFacture(facture);
                    di.setMontant(lireDecimal(row, 6));
                    di.setPaiement(lireDecimal(row, 7));
                    di.setRAP(lireDecimal(row, 8));
                    importRepo.save(di);

                    //Création automatique du dossier juridique
                    Dossier d = new Dossier();
                    d.setIp(ip);
                    d.setNumeroFacture(facture);
                    d.setBeneficiaire(di.getBeneficiaire());
                    d.setCin(di.getCin());
                    dossierService.creerDepuisImport(d, auteur);

                    importes++;

                } catch (Exception e) {
                    erreurs++;
                    details.add("Ligne " + (i + 1) + " : erreur — " + e.getMessage());
                    log.warn("Erreur import ligne {} : {}", i + 1, e.getMessage());
                }
            }
        }

        log.info("Import CCR terminé : {} importés, {} doublons, {} erreurs", importes, doublons, erreurs);

        return Map.of(
            "importes", importes,
            "doublons", doublons,
            "erreurs",  erreurs,
            "details",  details
        );
    }


    
    //  Helpers Apache POI

    // Lit une cellule comme texte, quel que soit son type. 
    private String lireTexte(Row row, int col) {
        Cell c = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (c == null) return "";
        return switch (c.getCellType()) {
            case STRING  -> c.getStringCellValue().trim();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(c))
                    yield c.getLocalDateTimeCellValue().toLocalDate().toString();
                double v = c.getNumericCellValue();
                // Évite "12345.0" pour les entiers
                yield (v == Math.floor(v)) ? String.valueOf((long) v) : String.valueOf(v);
            }
            case BOOLEAN -> String.valueOf(c.getBooleanCellValue());
            default      -> c.toString().trim();
        };
    }

    // Lit une cellule date (format Excel ou chaîne ISO). 
    private LocalDate lireDate(Row row, int col) {
        Cell c = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (c == null) return null;
        try {
            if (c.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(c)) {
                return c.getDateCellValue()
                    .toInstant()
                    .atZone(ZoneId.systemDefault())
                    .toLocalDate();
            }
            // Tente ISO-8601 (2024-07-15) ou localDateTimeCellValue
            return LocalDate.parse(c.getStringCellValue().trim());
        } catch (Exception e) {
            return null; // date non parsable → null
        }
    }

    // Lit une cellule numérique comme BigDecimal (0 si vide).
    private BigDecimal lireDecimal(Row row, int col) {
        Cell c = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (c == null) return BigDecimal.ZERO;
        try {
            return BigDecimal.valueOf(c.getNumericCellValue());
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    // Vérifie si une ligne Excel est entièrement vide.
    private boolean estVide(Row row) {
        for (int i = row.getFirstCellNum(); i < row.getLastCellNum(); i++) {
            Cell c = row.getCell(i);
            if (c != null && c.getCellType() != CellType.BLANK
                && !c.toString().isBlank()) return false;
        }
        return true;
    } */
}