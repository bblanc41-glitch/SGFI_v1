package com.sgifbackend.repositories;

import com.sgifbackend.models.HistoriqueDossier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistoriqueRepository extends JpaRepository<HistoriqueDossier, Long> {
    List<HistoriqueDossier> findByDossierIdDossierOrderByDateActionDesc(Long idDossier);
}

