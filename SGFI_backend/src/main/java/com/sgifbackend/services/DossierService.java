package com.sgifbackend.services;

import com.sgifbackend.models.Dossier;
import com.sgifbackend.models.HistoriqueDossier;
import com.sgifbackend.models.Statut;
import com.sgifbackend.repositories.DossierRepository;
import com.sgifbackend.repositories.HistoriqueRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
 
import java.time.Year;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
 
/**
 * Service principal — gestion du cycle de vie des dossiers SGFI.
 *
 * Workflow des statuts (4 phases) :
 *   IMPORTE_CCR / EN_ATTENTE_PRISE_EN_CHARGE
 *     → EN_ATTENTE_VALIDATION → INCOMPLET ↔ VALIDE_POUR_TRANSMISSION
 *     → ENVOYE_AVOCAT
 *     → EN_INSTANCE → EN_APPEL → EN_CASSATION
 *     → CLOTURE (motif obligatoire)
 */

@Service
@RequiredArgsConstructor
@Transactional
public class DossierService {
 
    private final DossierRepository    dossierRepo;
    private final HistoriqueRepository historiqueRepo;
 
    // ── LECTURE ─────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    // → 1 seule requête SQL avec LEFT JOIN FETCH (plus de problème N+1)
    public List<Dossier> findAll() {
        return dossierRepo.findAllAvecInfos();
    }
 
    
   /* @Transactional(readOnly = true)
    public List<Dossier> findAll() {
        return dossierRepo.findAll();
    }*/
    
    // ── DÉTAIL ────
    @Transactional(readOnly = true)
    public Dossier findById(Long id) {
        return dossierRepo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Dossier #" + id + " introuvable"));
    }
 
    // ── RECHERCHE 
    @Transactional(readOnly = true)
    public List<Dossier> rechercher(String terme) {
        return dossierRepo.rechercher(terme);
    }
 
    // ── FILTRE PAR STATUT
    @Transactional(readOnly = true)
    public List<Dossier> findByStatut(Statut statut) {
        return dossierRepo.findByStatutOrderByDateMiseAJourDesc(statut);
    }
 
 // ── DOSSIERS RÉCENTS (dashboard) 
    /*
    @Transactional(readOnly = true)
    public List<Dossier> getRecent() {
        // 5 derniers dossiers modifiés — pour le tableau du dashboard Angular
        return dossierRepo.findTop5ByOrderByDateMiseAJourDesc();
    }*/
    
    @Transactional(readOnly = true)
    public List<Dossier> getRecent() {
        List<Dossier> tous = dossierRepo.findRecentAvecInfos();
        return tous;
        // affichage de 5 dossiers seulement return tous.size() > 5 ? tous.subList(0, 5) : tous;
    }
 
    
    // ── HISTORIQUE 
    @Transactional(readOnly = true)
    public List<HistoriqueDossier> getHistorique(Long idDossier) {
        return historiqueRepo.findByDossierIdDossierOrderByDateActionDesc(idDossier);
    }
 
    // ── STATISTIQUES (dashboard Angular) ────────────────────────────────────
    // Retourne un Map compatible avec l'interface Stats du frontend :
    // { total, enAttente, envoyeAvocat, enInstance, cloture, incomplet, montantImpaye }
    @Transactional(readOnly = true)
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("total",         dossierRepo.count());
        stats.put("enAttente",     dossierRepo.countByStatut(Statut.EN_ATTENTE_PRISE_EN_CHARGE)
                                 + dossierRepo.countByStatut(Statut.IMPORTE_CCR));
        stats.put("envoyeAvocat",  dossierRepo.countByStatut(Statut.ENVOYE_AVOCAT)
                                 + dossierRepo.countByStatut(Statut.VALIDE_POUR_TRANSMISSION));
        stats.put("enInstance",    dossierRepo.countByStatut(Statut.EN_INSTANCE)
                                 + dossierRepo.countByStatut(Statut.EN_APPEL)
                                 + dossierRepo.countByStatut(Statut.EN_CASSATION));
        stats.put("cloture",       dossierRepo.countByStatut(Statut.CLOTURE));
        stats.put("incomplet",     dossierRepo.countByStatut(Statut.INCOMPLET));
        // montantImpaye = somme des RAP via @OneToOne avec DossierImport
        // Calculé séparément pour éviter une jointure lourde
        stats.put("montantImpaye", calculerMontantImpaye());
        return stats;
    }
 
    
    private double calculerMontantImpaye() {
        Double total = dossierRepo.sommeRestesAPayer();
        return (total != null) ? total : 0.0;
    }
    /*Methode lente
    private double calculerMontantImpaye() {
        // Somme des RAP de tous les dossiers actifs (non clôturés)
        return dossierRepo.findAll().stream()
            .filter(d -> d.getStatut() != Statut.CLOTURE)
            .filter(d -> d.getInfosOrigine() != null && d.getInfosOrigine().getRAP() != null)
            .mapToDouble(d -> d.getInfosOrigine().getRAP().doubleValue())
            .sum();
    }*/
 
    // ── CRÉATION — saisie manuelle ───────────────────────────────────────────
 
    public Dossier creer(Dossier dossier, String auteur) {
        verifierDoublon(dossier.getIp(), dossier.getNumeroFacture());
        dossier.setReferenceInterne(genererReference());
        dossier.setStatut(Statut.EN_ATTENTE_PRISE_EN_CHARGE);
        Dossier saved = dossierRepo.save(dossier);
        enregistrerHistorique(saved, null, Statut.EN_ATTENTE_PRISE_EN_CHARGE,
            auteur, "Création manuelle du dossier");
        return saved;
    }
 
    // ── CRÉATION — depuis importation CCR ───────────────────────────────────
 
    public Dossier creerDepuisImport(Dossier dossier, String auteur) {
        // Doublon silencieux — déjà vérifié par ImportationService
        if (dossierRepo.existsByIpAndNumeroFacture(dossier.getIp(), dossier.getNumeroFacture())) {
            return null;
        }
        dossier.setStatut(Statut.IMPORTE_CCR);
        dossier.setReferenceInterne(genererReference());
        Dossier saved = dossierRepo.save(dossier);
        enregistrerHistorique(saved, null, Statut.IMPORTE_CCR,
            auteur, "Importation automatique depuis fichier CCR");
        return saved;
    }
 
    // ── MODIFICATION (patch partiel) ────────────────────────────────────────
 
    public Dossier modifier(Long id, Dossier patch, String auteur) {
        Dossier d = findById(id);
        if (patch.getBeneficiaire()         != null) d.setBeneficiaire(patch.getBeneficiaire());
        if (patch.getCin()                  != null) d.setCin(patch.getCin());
        if (patch.getTelephone()            != null) d.setTelephone(patch.getTelephone());
        if (patch.getObservationJuridique() != null) d.setObservationJuridique(patch.getObservationJuridique());
        if (patch.getJugement()             != null) d.setJugement(patch.getJugement());
        if (patch.getDateAudience()         != null) d.setDateAudience(patch.getDateAudience());
        return dossierRepo.save(d);
    }
 
    // ── CHANGEMENT DE STATUT (workflow) ─────────────────────────────────────
 
    public Dossier changerStatut(Long id, Statut nouveauStatut, String motif, String auteur) {
        Dossier d     = findById(id);
        Statut  ancien = d.getStatut();
        validerMotif(nouveauStatut, motif);
        d.setStatut(nouveauStatut);
        if (motif != null && !motif.isBlank()) d.setMotif(motif);
        Dossier saved = dossierRepo.save(d);
        enregistrerHistorique(saved, ancien, nouveauStatut, auteur, motif);
        return saved;
    }
 
    // ── UTILITAIRES PRIVÉS ──────────────────────────────────────────────────
 
    private void verifierDoublon(String ip, String facture) {
        if (dossierRepo.existsByIpAndNumeroFacture(ip, facture)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Dossier déjà existant pour IP=" + ip + " / Facture=" + facture);
        }
    }
 
    private void validerMotif(Statut s, String motif) {
        if ((s == Statut.CLOTURE || s == Statut.INCOMPLET)&& (motif == null || motif.isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Motif obligatoire pour le statut : " + s.getLibelle());
        }
    }
 
    private void enregistrerHistorique(Dossier d, Statut ancien, Statut nouveau,
                                       String auteur, String commentaire) {
        historiqueRepo.save(new HistoriqueDossier(d, ancien, nouveau, auteur, commentaire));
    }
 
    private String genererReference() {
        long n = dossierRepo.count() + 1;
        return String.format("REF-JUR-%d-%04d", Year.now().getValue(), n);
    }
	
    /*Eviter les doublons avec UUID
     private String genererReference() {
    // Génération unique : REF-JUR-2026-A8F3C2D1 (8 premiers caractères d'un UUID)
    String uuidPart = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    return String.format("REF-JUR-%d-%s", Year.now().getValue(), uuidPart);
	}
     * */
	
	
	
	
	
	
	
	
	
	
	
/* Ancienne version
    private final DossierRepository    dossierRepo;
    private final HistoriqueRepository historiqueRepo;

    // Lecture
    
    @Transactional(readOnly = true)
    public List<Dossier> findAll() { return dossierRepo.findAll(); }

    @Transactional(readOnly = true)
    public Dossier findById(Long id) {
        return dossierRepo.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Dossier #" + id + " introuvable"));
    }

    @Transactional(readOnly = true)
    public List<Dossier> rechercher(String terme) { return dossierRepo.rechercher(terme); }

    @Transactional(readOnly = true)
    public List<Dossier> findByStatut(Statut s)  { return dossierRepo.findByStatut(s); }

    @Transactional(readOnly = true)
    public List<HistoriqueDossier> getHistorique(Long idDossier) {
        return historiqueRepo.findByDossierIdDossierOrderByDateActionDesc(idDossier);
    }

    // Statistiques (tableau de bord)
    
    @Transactional(readOnly = true)
    public Map<String, Long> getStats() {
        return Map.of(
            "total",         dossierRepo.count(),
            "enAttente",     countByStatut(Statut.EN_ATTENTE_PRISE_EN_CHARGE),
            "envoyeAvocat",  countByStatut(Statut.ENVOYE_AVOCAT),
            "enInstance",    countByStatut(Statut.EN_INSTANCE),
            "cloture",       countByStatut(Statut.CLOTURE),
            "incomplet",     countByStatut(Statut.INCOMPLET)
        );
    }

    private long countByStatut(Statut s) {
        return dossierRepo.findByStatut(s).size();
    }

    //Création — saisie manuelle
    
    public Dossier creer(Dossier dossier, String auteur) {
        verifierDoublon(dossier.getIp(), dossier.getNumeroFacture());
        dossier.setReferenceInterne(genererReference());
        dossier.setStatut(Statut.EN_ATTENTE_PRISE_EN_CHARGE);
        Dossier saved = dossierRepo.save(dossier);
        enregistrerHistorique(saved, null, Statut.EN_ATTENTE_PRISE_EN_CHARGE,
            auteur, "Création manuelle du dossier");
        return saved;
    }
	
	

   
     // Création depuis l'importation CCR (statut IMPORTE_CCR).
     // Appelé par ImportationService — ne vérifie pas le doublon
     //car l'import l'a déjà vérifié.
    
	

    public Dossier creerDepuisImport(Dossier dossier, String auteur) {
        if (dossierRepo.existsByIpAndNumeroFacture(dossier.getIp(), dossier.getNumeroFacture())) {
            return null; // doublon silencieux lors de l'import
        }
        dossier.setStatut(Statut.IMPORTE_CCR);
        dossier.setReferenceInterne(genererReference());
        Dossier saved = dossierRepo.save(dossier);
        enregistrerHistorique(saved, null, Statut.IMPORTE_CCR,
            auteur, "Importation automatique depuis le fichier CCR");
        return saved;
    }

    // Modification (patch partiel)
    
    public Dossier modifier(Long id, Dossier patch, String auteur) {
        Dossier d = findById(id);
        if (patch.getBeneficiaire()        != null) d.setBeneficiaire(patch.getBeneficiaire());
        if (patch.getCin()                 != null) d.setCin(patch.getCin());
        if (patch.getTelephone()           != null) d.setTelephone(patch.getTelephone());
        if (patch.getObservationJuridique()!= null) d.setObservationJuridique(patch.getObservationJuridique());
        if (patch.getJugement()            != null) d.setJugement(patch.getJugement());
        if (patch.getDateAudience()        != null) d.setDateAudience(patch.getDateAudience());
        return dossierRepo.save(d);
    }

    // Changement de statut (cœur du workflow)

    public Dossier changerStatut(Long id, Statut nouveauStatut, String motif, String auteur) {
        Dossier d     = findById(id);
        Statut  ancien = d.getStatut();

        validerMotif(nouveauStatut, motif);

        d.setStatut(nouveauStatut);
        if (motif != null && !motif.isBlank()) d.setMotif(motif);

        Dossier saved = dossierRepo.save(d);
        enregistrerHistorique(saved, ancien, nouveauStatut, auteur, motif);
        return saved;
    }

    //Utilitaires privés
    
    private void verifierDoublon(String ip, String facture) {
        if (dossierRepo.existsByIpAndNumeroFacture(ip, facture)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Un dossier existe déjà pour IP=" + ip + " / Facture=" + facture);
        }
    }

    private void validerMotif(Statut s, String motif) {
        boolean motifObligatoire = (s == Statut.CLOTURE || s == Statut.INCOMPLET);
        if (motifObligatoire && (motif == null || motif.isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Le motif est obligatoire pour passer au statut : " + s.getLibelle());
        }
    }

    private void enregistrerHistorique(Dossier d, Statut ancien, Statut nouveau,
                                       String auteur, String commentaire) {
        historiqueRepo.save(new HistoriqueDossier(d, ancien, nouveau, auteur, commentaire));
    }

    //Génère une référence unique : REF-JUR-2025-0001
    private String genererReference() {
        long n = dossierRepo.count() + 1;
        return String.format("REF-JUR-%d-%04d", Year.now().getValue(), n);
    }*/
}