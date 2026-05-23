package com.sgifbackend.repositories;

import com.sgifbackend.models.SuiviJuridique;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SuiviJuridiqueRepository extends JpaRepository<SuiviJuridique, Long> {
    Optional<SuiviJuridique> findByReferenceInterne(String referenceInterne);
    void deleteByReferenceInterne(String referenceInterne);
}