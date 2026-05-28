package com.sgifbackend.controllers;

import com.sgifbackend.models.SuiviJuridique;
import com.sgifbackend.models.SuiviJuridiqueId;
import com.sgifbackend.models.TypeAudience;
import com.sgifbackend.services.SuiviJuridiqueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dossiers/{referenceInterne}/suivis")
@RequiredArgsConstructor
public class SuiviJuridiqueController {

    private final SuiviJuridiqueService service;

    @GetMapping
    public ResponseEntity<List<SuiviJuridique>> getSuivis(@PathVariable String referenceInterne) {
        return ResponseEntity.ok(service.getSuivisByDossier(referenceInterne));
    }

    @PostMapping
    public ResponseEntity<?> createSuivi(@PathVariable String referenceInterne,
                                          @RequestBody SuiviJuridique suivi) {
        try {
            // Forcer la référence interne depuis l'URL (sécurité)
            suivi.setReferenceInterne(referenceInterne);
            
            SuiviJuridique created = service.createSuivi(suivi);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping
    public ResponseEntity<?> updateSuivi(@PathVariable String referenceInterne,
                                          @RequestBody SuiviJuridique suivi) {
        try {
            // Forcer la référence interne depuis l'URL (sécurité)
            suivi.setReferenceInterne(referenceInterne);
            
            SuiviJuridique updated = service.updateSuivi(suivi);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{referenceExterne}/{typeAudience}")
    public ResponseEntity<Void> deleteSuivi(@PathVariable String referenceInterne,
                                             @PathVariable String referenceExterne,
                                             @PathVariable String typeAudience) {
        SuiviJuridiqueId id = new SuiviJuridiqueId(
            referenceInterne,
            referenceExterne,
            TypeAudience.valueOf(typeAudience)
        );
        
        boolean deleted = service.deleteSuivi(id);
        return deleted ? ResponseEntity.noContent().build() 
                       : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/type/{typeAudience}")
    public ResponseEntity<Void> deleteSuiviByType(@PathVariable String referenceInterne,
                                                   @PathVariable String typeAudience) {
        boolean deleted = service.deleteSuiviByReferenceAndType(
            referenceInterne, 
            TypeAudience.valueOf(typeAudience)
        );
        return deleted ? ResponseEntity.noContent().build() 
                       : ResponseEntity.notFound().build();
    }

    // Endpoint pour créer ou mettre à jour (compatible avec l'ancienne logique)
    @PostMapping("/upsert")
    public ResponseEntity<?> upsertSuivi(@PathVariable String referenceInterne,
                                          @RequestBody SuiviJuridique suivi) {
        try {
            suivi.setReferenceInterne(referenceInterne);
            SuiviJuridique result = service.createOrUpdate(suivi);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}