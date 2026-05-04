package com.sgifbackend.controllers;

import com.sgifbackend.services.ImportationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

// REST Controller — POST /api/importation
 // Reçoit le fichier Excel CCR envoyé par Angular (FormData)
 // et délègue le traitement à ImportationService.
 
@RestController
@RequestMapping("/api/importation")
@RequiredArgsConstructor
public class ImportationController {

    private final ImportationService importationService;

    // POST /api/importation
     // Content-Type: multipart/form-data (géré automatiquement par Angular)
     // Paramètre : file — le fichier .xlsx envoyé via FormData
     //
     // Retourne : { importes: N, doublons: N, erreurs: N, details: [...] }

    @PostMapping
    public ResponseEntity<Map<String, Object>> importerCcr(
            @RequestParam("file") MultipartFile fichier,
            Authentication auth) {
        try {
            String auteur  = (auth != null) ? auth.getName() : "système";
            Map<String, Object> rapport = importationService.importerFichierCcr(fichier, auteur);
            return ResponseEntity.ok(rapport);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of(
                    "importes", 0, "doublons", 0, "erreurs", 1,
                    "details", java.util.List.of("Erreur serveur : " + e.getMessage())
                ));
        }
    }
}