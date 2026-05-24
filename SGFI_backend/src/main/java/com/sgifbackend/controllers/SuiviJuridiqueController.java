package com.sgifbackend.controllers;

import com.sgifbackend.models.SuiviJuridique;
import com.sgifbackend.models.TypeAudience;
import com.sgifbackend.services.DossierService;
import com.sgifbackend.services.SuiviJuridiqueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dossiers/{dossierId}/suivis")
@RequiredArgsConstructor
public class SuiviJuridiqueController {

    private final SuiviJuridiqueService service;
    //private final DossierService dossierService;
    
    
    @GetMapping
    public List<SuiviJuridique> getSuivis(@PathVariable String referenceInterne) {
        return service.getSuivisByDossier(referenceInterne);
    }

    @PostMapping
    public ResponseEntity<SuiviJuridique> addOrUpdate(@PathVariable String referenceInterne,
                                                      @RequestBody Map<String, Object> payload) {
        TypeAudience type = TypeAudience.valueOf((String) payload.get("typeAudience"));
        String refExt = (String) payload.get("referenceExterne");
        String jugement = (String) payload.get("jugement");
        LocalDate dateAudience = payload.get("dateAudience") != null ? LocalDate.parse((String) payload.get("dateAudience")) : null;
        var suivi = service.addOrUpdateSuivi(referenceInterne, type, refExt, jugement, dateAudience);
        return ResponseEntity.ok(suivi);
    }

    @DeleteMapping("/{typeAudience}")
    public ResponseEntity<Void> delete(@PathVariable String referenceInterne,
                                       @PathVariable String typeAudience) {
        service.deleteSuivi(referenceInterne, TypeAudience.valueOf(typeAudience));
        return ResponseEntity.noContent().build();
    }
    
/*
    @GetMapping
    public List<SuiviJuridique> getSuivis(@PathVariable Long dossierId) {
        return service.getSuivisByDossier(dossierId);
    }

    @PostMapping
    public ResponseEntity<SuiviJuridique> addOrUpdate(@PathVariable Long dossierId,
                                                      @RequestBody Map<String, Object> payload) {
        TypeAudience type = TypeAudience.valueOf((String) payload.get("typeAudience"));
        String refExt = (String) payload.get("referenceExterne");
        String jugement = (String) payload.get("jugement");
        LocalDate dateAudience = payload.get("dateAudience") != null ? LocalDate.parse((String) payload.get("dateAudience")) : null;
        var dossier = dossierService.findById(dossierId);
        var suivi = service.addOrUpdateSuivi(dossier, type, refExt, jugement, dateAudience);
        return ResponseEntity.ok(suivi);
    }

    @DeleteMapping("/{suiviId}")
    public ResponseEntity<Void> delete(@PathVariable Long suiviId) {
        service.deleteSuivi(suiviId);
        return ResponseEntity.noContent().build();
    }*/
}