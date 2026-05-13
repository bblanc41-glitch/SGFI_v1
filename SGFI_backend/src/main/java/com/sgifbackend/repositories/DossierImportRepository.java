// ─── DossierImportRepository.java ────────────────────────────────────────────
package com.sgifbackend.repositories;

import com.sgifbackend.models.DossierImport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DossierImportRepository extends JpaRepository<DossierImport, Long> {

    Optional<DossierImport> findByIpAndNumeroFacture(String ip, String numeroFacture);

    // Vérifie doublon avant import CCR
    boolean existsByIpAndNumeroFacture(String ip, String numeroFacture);
    
    @Query(value = """
            SELECT COALESCE(SUM(di.rap), 0)
            FROM   dossiersImportes di
            INNER JOIN dossiers d
                   ON  d.ip = di.ip
                   AND d.numeroFacture = di.numeroFacture
            WHERE  d.statut != 'CLOTURE'
            """, nativeQuery = true)
    Double sommeRestesAPayer();
}