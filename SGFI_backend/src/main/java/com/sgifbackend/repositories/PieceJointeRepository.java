package com.sgifbackend.repositories;

import com.sgifbackend.models.PieceJointe;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PieceJointeRepository extends JpaRepository<PieceJointe, Long> {
    List<PieceJointe> findByDossierIdDossier(Long dossierId);
    void deleteByCheminStockage(String chemin);
}