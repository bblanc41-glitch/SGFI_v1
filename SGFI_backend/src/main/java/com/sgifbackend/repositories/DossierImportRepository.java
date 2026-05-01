// ─── DossierImportRepository.java ────────────────────────────────────────────
package com.sgifbackend.repositories;

import com.sgifbackend.models.DossierImport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DossierImportRepository extends JpaRepository<DossierImport, Long> {

    Optional<DossierImport> findByIpAndNumeroFacture(String ip, String numeroFacture);
    boolean existsByIpAndNumeroFacture(String ip, String numeroFacture);
}