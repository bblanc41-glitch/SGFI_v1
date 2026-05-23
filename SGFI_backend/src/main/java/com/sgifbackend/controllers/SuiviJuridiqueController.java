package com.sgifbackend.controllers;

import com.sgifbackend.models.SuiviJuridique;
import com.sgifbackend.services.SuiviJuridiqueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/suivi")
@RequiredArgsConstructor
public class SuiviJuridiqueController {

    private final SuiviJuridiqueService service;

    @GetMapping("/{referenceInterne}")
    public ResponseEntity<SuiviJuridique> getByReference(@PathVariable String referenceInterne) {
        return service.findByReference(referenceInterne)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{referenceInterne}")
    public ResponseEntity<SuiviJuridique> update(@PathVariable String referenceInterne,
                                                 @RequestBody SuiviJuridique suivi) {
        SuiviJuridique existing = service.getOrCreateByReference(referenceInterne);
        if (suivi.getReferenceExterne() != null)
            existing.setReferenceExterne(suivi.getReferenceExterne());
        if (suivi.getTypeAudience() != null)
            existing.setTypeAudience(suivi.getTypeAudience());
        if (suivi.getJugement() != null)
            existing.setJugement(suivi.getJugement());
        return ResponseEntity.ok(service.save(existing));
    }
}