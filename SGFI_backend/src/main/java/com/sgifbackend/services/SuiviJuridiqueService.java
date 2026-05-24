package com.sgifbackend.services;

import com.sgifbackend.models.Dossier;
import com.sgifbackend.models.SuiviJuridique;
import com.sgifbackend.models.TypeAudience;
import com.sgifbackend.repositories.SuiviJuridiqueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SuiviJuridiqueService {

	
	
	
   private final SuiviJuridiqueRepository repository;
   

   // Récupère tous les suivis d'un dossier (par référence interne)
   public List<SuiviJuridique> getSuivisByDossier(String referenceInterne) {
       return repository.findByReferenceInterneOrderByDateAudienceDesc(referenceInterne);
   }

   public SuiviJuridique addOrUpdateSuivi(String referenceInterne, TypeAudience type,
                                          String referenceExterne, String jugement, LocalDate dateAudience) {
       SuiviJuridique suivi = repository.findByReferenceInterneAndTypeAudience(referenceInterne, type)
               .orElse(SuiviJuridique.builder()
                       .referenceInterne(referenceInterne)
                       .typeAudience(type)
                       .build());
       suivi.setReferenceExterne(referenceExterne);
       suivi.setJugement(jugement);
       suivi.setDateAudience(dateAudience);
       return repository.save(suivi);
   }

   public void deleteSuivi(String referenceInterne, TypeAudience type) {
       repository.findByReferenceInterneAndTypeAudience(referenceInterne, type)
               .ifPresent(repository::delete);
   }
   
/*
    // Récupère ou crée un suivi par référence interne et type d'audience
    public SuiviJuridique getOrCreateByReferenceAndType(String referenceInterne, TypeAudience type) {
        return repository.findByDossier_ReferenceInterneAndTypeAudience(referenceInterne, type)
                .orElseGet(() -> {
                    SuiviJuridique nouveau = SuiviJuridique.builder()
                            .dossier(Dossier.builder().referenceInterne(referenceInterne).build())
                            .typeAudience(type)
                            .build();
                    return repository.save(nouveau);
                });
    }

    
     public void deleteSuivi(Long suiviId) {
        repository.deleteById(suiviId);
    }
    
    // Nouvelle méthode getOrCreateByReference (alias)
    public SuiviJuridique getOrCreateByReference(String referenceInterne) {
        // Par défaut, on crée un suivi pour le type INSTANCE (ou autre selon votre besoin)
        // Vous pouvez passer le type en paramètre si nécessaire
        return getOrCreateByReferenceAndType(referenceInterne, TypeAudience.INSTANCE);
    }

    */
    
    
    // Nouvelle méthode save (pour updateSuiviJuridique)
    public SuiviJuridique save(SuiviJuridique suivi) {
        return repository.save(suivi);
    }
    
    

   
}