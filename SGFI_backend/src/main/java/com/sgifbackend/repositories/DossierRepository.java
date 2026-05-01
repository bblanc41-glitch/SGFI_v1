package com.sgifbackend.repositories;

import com.sgifbackend.models.Dossier;
import com.sgifbackend.models.Statut;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DossierRepository extends JpaRepository<Dossier, Long> {

    List<Dossier> findByStatut(Statut statut);

    // Recherche multi-critères (IP, bénéficiaire, CIN, téléphone, référence)
    @Query("""
        SELECT d FROM Dossier d
        WHERE LOWER(d.ip)               LIKE LOWER(CONCAT('%', :terme, '%'))
           OR LOWER(d.beneficiaire)     LIKE LOWER(CONCAT('%', :terme, '%'))
           OR LOWER(d.cin)              LIKE LOWER(CONCAT('%', :terme, '%'))
           OR LOWER(d.telephone)        LIKE LOWER(CONCAT('%', :terme, '%'))
           OR LOWER(d.referenceInterne) LIKE LOWER(CONCAT('%', :terme, '%'))
        """)
    List<Dossier> rechercher(@Param("terme") String terme);

    boolean existsByIpAndNumeroFacture(String ip, String numeroFacture);
}