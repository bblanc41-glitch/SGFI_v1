package com.sgifbackend.controllers;

import com.sgifbackend.services.AlerteSuiviService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/alertes")
@RequiredArgsConstructor
public class AlerteController {

    private final AlerteSuiviService alerteSuiviService;

    @PostMapping("/verifier")
    public ResponseEntity<String> verifierAlertes() {
        alerteSuiviService.verifierAlertesManuellement();
        return ResponseEntity.ok("Vérification des alertes lancée");
    }
}