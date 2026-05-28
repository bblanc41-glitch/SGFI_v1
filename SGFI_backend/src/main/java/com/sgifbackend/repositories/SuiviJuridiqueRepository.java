package com.sgifbackend.repositories;

import com.sgifbackend.models.SuiviJuridique;
import com.sgifbackend.models.SuiviJuridiqueId;
import com.sgifbackend.models.TypeAudience;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SuiviJuridiqueRepository extends JpaRepository<SuiviJuridique, SuiviJuridiqueId> {
    
    // Lecture
    List<SuiviJuridique> findByReferenceInterneOrderByDateAudienceDesc(String referenceInterne);
    
    Optional<SuiviJuridique> findByReferenceInterneAndTypeAudience(String referenceInterne, TypeAudience type);
    
    boolean existsByReferenceInterneAndTypeAudience(String referenceInterne, TypeAudience type);
    
    // Suppression
    @Modifying
    @Query("DELETE FROM SuiviJuridique s WHERE s.referenceInterne = :refInterne AND s.typeAudience = :type")
    void deleteByReferenceInterneAndTypeAudience(@Param("refInterne") String referenceInterne, 
                                                  @Param("type") TypeAudience type);
    
    long countByReferenceInterne(String referenceInterne);
}