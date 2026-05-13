package com.sgifbackend.controllers;

import com.sgifbackend.config.FileStorageUtil;
import com.sgifbackend.models.Dossier;
import com.sgifbackend.models.PieceJointe;
import com.sgifbackend.repositories.PieceJointeRepository;
import com.sgifbackend.services.DossierService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dossiers/{idDossier}/pieces")
@RequiredArgsConstructor
public class PieceJustificativeController {

    private final FileStorageUtil fileStorageUtil;
    private final PieceJointeRepository pieceJointeRepository;
    private final DossierService dossierService;

    // POST - upload
    @PostMapping
    public ResponseEntity<?> uploadPiece(@PathVariable Long idDossier,
                                         @RequestParam("file") MultipartFile file,
                                         Authentication auth) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Fichier vide"));
        }
        try {
            String cheminRelatif = fileStorageUtil.stockerFichier(file, idDossier);
            Dossier dossier = dossierService.findById(idDossier);
            PieceJointe pj = new PieceJointe();
            pj.setNomFichier(file.getOriginalFilename());
            pj.setCheminStockage(cheminRelatif);
            pj.setTaille(file.getSize());
            pj.setDossier(dossier);
            pieceJointeRepository.save(pj);
            return ResponseEntity.ok(Map.of("id", pj.getId(), "message", "Fichier uploadé"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur stockage : " + e.getMessage()));
        }
    }

    // GET - liste des pièces
    @GetMapping
    public ResponseEntity<List<PieceJointe>> getPieces(@PathVariable Long idDossier) {
        return ResponseEntity.ok(pieceJointeRepository.findByDossierIdDossier(idDossier));
    }

    // GET - télécharger une pièce par son ID
    @GetMapping("/{pieceId}/download")
    public ResponseEntity<Resource> downloadPiece(@PathVariable Long idDossier,
                                                  @PathVariable Long pieceId) {
        try {
            PieceJointe pj = pieceJointeRepository.findById(pieceId)
                    .orElseThrow(() -> new RuntimeException("Pièce non trouvée"));
            Path fichierPath = Paths.get(fileStorageUtil.getUploadDir())
                                     .resolve(pj.getCheminStockage())
                                     .normalize();
            Resource resource = new UrlResource(fichierPath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_OCTET_STREAM)
                        .header(HttpHeaders.CONTENT_DISPOSITION,
                                "attachment; filename=\"" + pj.getNomFichier() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // DELETE - supprimer une pièce
    @DeleteMapping("/{pieceId}")
    public ResponseEntity<?> deletePiece(@PathVariable Long idDossier,
                                         @PathVariable Long pieceId,
                                         Authentication auth) {
        try {
            PieceJointe pj = pieceJointeRepository.findById(pieceId)
                    .orElseThrow(() -> new RuntimeException("Pièce non trouvée"));
            fileStorageUtil.supprimerFichier(pj.getCheminStockage());
            pieceJointeRepository.delete(pj);
            return ResponseEntity.ok(Map.of("message", "Pièce supprimée"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur suppression : " + e.getMessage()));
        }
    }
}