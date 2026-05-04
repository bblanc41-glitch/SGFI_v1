package com.sgifbackend.controllers;

import com.sgifbackend.models.Dossier;
import com.sgifbackend.models.HistoriqueDossier;
import com.sgifbackend.models.Statut;
import com.sgifbackend.services.DossierService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller — Dossiers SGFI
 *
 * GET    /api/dossiers                → liste complète
 * GET    /api/dossiers/{id}           → détail
 * GET    /api/dossiers/recherche?terme=... → recherche multi-critères
 * GET    /api/dossiers/statut/{statut}    → filtrer par statut
 * GET    /api/dossiers/{id}/historique   → journal des actions
 * GET    /api/dossiers/stats             → statistiques du tableau de bord
 * POST   /api/dossiers                → créer (saisie manuelle)
 * PUT    /api/dossiers/{id}           → modifier les champs
 * PATCH  /api/dossiers/{id}/statut    → changer le statut (workflow)
 */

@RestController
@RequestMapping("/api/dossiers")
@RequiredArgsConstructor
public class DossierController {
 
    private final DossierService service;
 
    // ── GET /api/dossiers — liste complète ───────────────────────────────────
    @GetMapping
    public List<Dossier> getAll() {
        return service.findAll();
    }
 
    // ── GET /api/dossiers/{id} — détail d'un dossier ────────────────────────
    @GetMapping("/{id}")
    public Dossier getById(@PathVariable Long id) {
        return service.findById(id);
    }
 
    // ── GET /api/dossiers/recent?limit=5 — dossiers récents (dashboard) ─────
    @GetMapping("/recent")
    public List<Dossier> getRecent(@RequestParam(defaultValue = "5") int limit) {
        // limit est ignoré pour l'instant (findTop5 est fixe)
        // À améliorer avec Pageable si nécessaire
        return service.getRecent();
    }
 
    // ── GET /api/dossiers/recherche?terme=... — recherche multi-critères ─────
    @GetMapping("/recherche")
    public List<Dossier> rechercher(@RequestParam String terme) {
        return service.rechercher(terme);
    }
 
    // ── GET /api/dossiers/statut/{statut} — filtre par statut ───────────────
    @GetMapping("/statut/{statut}")
    public List<Dossier> getByStatut(@PathVariable String statut) {
        try {
            return service.findByStatut(Statut.valueOf(statut));
        } catch (IllegalArgumentException e) {
            return List.of(); // statut inconnu → liste vide
        }
    }
 
    // ── GET /api/dossiers/{id}/historique — journal d'audit ─────────────────
    @GetMapping("/{id}/historique")
    public List<HistoriqueDossier> getHistorique(@PathVariable Long id) {
        return service.getHistorique(id);
    }
 
    // ── GET /api/dossiers/stats — statistiques pour le dashboard Angular ─────
    // Retourne : { total, enAttente, envoyeAvocat, enInstance, cloture, incomplet, montantImpaye }
    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        return service.getStats();
    }
 
    // ── POST /api/dossiers — saisie manuelle ────────────────────────────────
    @PostMapping
    public ResponseEntity<Dossier> creer(@RequestBody Dossier dossier,
                                          Authentication auth) {
        Dossier created = service.creer(dossier, auteur(auth));
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
 
    // ── PUT /api/dossiers/{id} — modification des champs ────────────────────
    @PutMapping("/{id}")
    public Dossier modifier(@PathVariable Long id,
                             @RequestBody Dossier patch,
                             Authentication auth) {
        return service.modifier(id, patch, auteur(auth));
    }
 
    // ── PATCH /api/dossiers/{id}/statut — changement de statut (workflow) ───
    // Body JSON : { "statut": "CLOTURE", "motif": "Paiement reçu" }
    // motif obligatoire pour CLOTURE et INCOMPLET
    @PatchMapping("/{id}/statut")
    public Dossier changerStatut(@PathVariable Long id,
                                  @RequestBody Map<String, String> body,
                                  Authentication auth) {
        Statut nouveauStatut = Statut.valueOf(body.get("statut"));
        String motif         = body.get("motif");
        return service.changerStatut(id, nouveauStatut, motif, auteur(auth));
    }
 
    // ── Utilitaire : extrait le username depuis le token JWT ─────────────────
    private String auteur(Authentication auth) {
        return (auth != null) ? auth.getName() : "système";
    }	
	
	
	
	
	
	
/* Version 1
    private final DossierService service;

    // Lecture

    @GetMapping
    public List<Dossier> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Dossier getById(@PathVariable Long id) {
        return service.findById(id);
    }

    @GetMapping("/recherche")
    public List<Dossier> rechercher(@RequestParam String terme) {
        return service.rechercher(terme);
    }

    @GetMapping("/statut/{statut}")
    public List<Dossier> getByStatut(@PathVariable Statut statut) {
        return service.findByStatut(statut);
    }

    @GetMapping("/{id}/historique")
    public List<HistoriqueDossier> getHistorique(@PathVariable Long id) {
        return service.getHistorique(id);
    }

    @GetMapping("/stats")
    public Map<String, Long> getStats() {
        return service.getStats();
    }

    //Ecriture

    @PostMapping
    public ResponseEntity<Dossier> creer(@RequestBody Dossier dossier, Authentication auth) {
        String auteur = auteur(auth);
        return ResponseEntity.status(HttpStatus.CREATED).body(service.creer(dossier, auteur));
    }

    @PutMapping("/{id}")
    public Dossier modifier(@PathVariable Long id,
                             @RequestBody Dossier patch,
                             Authentication auth) {
        return service.modifier(id, patch, auteur(auth));
    }
    

  
     //Changement de statut (workflow).
     //Body JSON : { "statut": "CLOTURE", "motif": "Paiement reçu" }
    // Le motif est obligatoire pour CLOTURE et INCOMPLET.
     
	

    @PatchMapping("/{id}/statut")
    public Dossier changerStatut(@PathVariable Long id,
                                  @RequestBody Map<String, String> body,
                                  Authentication auth) {
        Statut nouveauStatut = Statut.valueOf(body.get("statut"));
        String motif         = body.get("motif");
        return service.changerStatut(id, nouveauStatut, motif, auteur(auth));
    }

    //Utilitaire
    // Extrait le nom de l'utilisateur authentifié, ou "système" par défaut.
    private String auteur(Authentication auth) {
        return (auth != null) ? auth.getName() : "système";
    }*/
}