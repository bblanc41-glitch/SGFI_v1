package com.sgifbackend.repositories;

import com.sgifbackend.models.SuiviJuridique;
import com.sgifbackend.models.SuiviJuridiqueId;
import com.sgifbackend.models.TypeAudience;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SuiviJuridiqueRepository extends JpaRepository<SuiviJuridique, SuiviJuridiqueId> {
    List<SuiviJuridique> findByReferenceInterneOrderByDateAudienceDesc(String referenceInterne);
    Optional<SuiviJuridique> findByReferenceInterneAndTypeAudience(String referenceInterne, TypeAudience type);
    boolean existsByReferenceInterneAndTypeAudience(String referenceInterne, TypeAudience type);
}