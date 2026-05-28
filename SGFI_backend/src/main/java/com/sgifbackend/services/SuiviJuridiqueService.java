package com.sgifbackend.services;

import com.sgifbackend.models.SuiviJuridique;
import com.sgifbackend.models.SuiviJuridiqueId;
import com.sgifbackend.models.TypeAudience;
import com.sgifbackend.repositories.SuiviJuridiqueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Service de gestion des suivis juridiques
 * Respecte les principes SOLID :
 * - S (Single Responsibility) : Chaque méthode a une responsabilité unique
 * - O (Open/Closed) : Ouvert à l'extension, fermé à la modification
 * - L (Liskov Substitution) : Utilisation d'interfaces
 * - I (Interface Segregation) : Méthodes spécialisées
 * - D (Dependency Inversion) : Dépendance vers l'abstraction Repository
 */
@Service
@RequiredArgsConstructor
@Transactional
public class SuiviJuridiqueService {

    private final SuiviJuridiqueRepository repository;

    // ==================== MÉTHODES DE LECTURE ====================
    
    /**
     * Récupère tous les suivis d'un dossier par référence interne
     */
    @Transactional(readOnly = true)
    public List<SuiviJuridique> getSuivisByDossier(String referenceInterne) {
        return repository.findByReferenceInterneOrderByDateAudienceDesc(referenceInterne);
    }
    
    /**
     * Récupère un suivi spécifique par sa clé composite
     */
    @Transactional(readOnly = true)
    public Optional<SuiviJuridique> getSuiviById(SuiviJuridiqueId id) {
        return repository.findById(id);
    }
    
    /**
     * Vérifie si un suivi existe pour un type d'audience donné
     */
    @Transactional(readOnly = true)
    public boolean existsByReferenceAndType(String referenceInterne, TypeAudience type) {
        return repository.existsByReferenceInterneAndTypeAudience(referenceInterne, type);
    }
    
    /**
     * Vérifie si un suivi existe par sa clé composite
     */
    @Transactional(readOnly = true)
    public boolean existsById(SuiviJuridiqueId id) {
        return repository.existsById(id);
    }

    // ==================== MÉTHODES D'ÉCRITURE ====================
    
    /**
     * Crée un nouveau suivi juridique
     * @throws IllegalArgumentException si un suivi avec la même clé existe déjà
     */
    public SuiviJuridique createSuivi(SuiviJuridique suivi) {
        // Validation
        validateSuivi(suivi);
        
        // Vérification d'existence
        SuiviJuridiqueId id = new SuiviJuridiqueId(
            suivi.getReferenceInterne(),
            suivi.getReferenceExterne(),
            suivi.getTypeAudience()
        );
        
        if (repository.existsById(id)) {
            throw new IllegalArgumentException(
                String.format("Un suivi existe déjà pour la référence %s, type %s et référence externe %s",
                    suivi.getReferenceInterne(), suivi.getTypeAudience(), suivi.getReferenceExterne())
            );
        }
        
        return repository.save(suivi);
    }
    
    /**
     * Met à jour un suivi existant
     * @throws IllegalArgumentException si le suivi n'existe pas
     */
    public SuiviJuridique updateSuivi(SuiviJuridique suivi) {
        // Validation
        validateSuivi(suivi);
        
        // Vérification d'existence
        SuiviJuridiqueId id = new SuiviJuridiqueId(
            suivi.getReferenceInterne(),
            suivi.getReferenceExterne(),
            suivi.getTypeAudience()
        );
        
        SuiviJuridique existingSuivi = repository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException(
                String.format("Aucun suivi trouvé pour la référence %s, type %s et référence externe %s",
                    suivi.getReferenceInterne(), suivi.getTypeAudience(), suivi.getReferenceExterne())
            ));
        
        // Mise à jour des champs modifiables
        existingSuivi.setJugement(suivi.getJugement());
        existingSuivi.setDateAudience(suivi.getDateAudience());
        
        return repository.save(existingSuivi);
    }
    
    /**
     * Supprime un suivi par sa clé composite
     * @return true si supprimé, false si non trouvé
     */
    public boolean deleteSuivi(SuiviJuridiqueId id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return true;
        }
        return false;
    }
    
    /**
     * Supprime un suivi par référence interne et type d'audience
     * (Utile quand la référence externe n'est pas connue)
     */
    public boolean deleteSuiviByReferenceAndType(String referenceInterne, TypeAudience type) {
        return repository.findByReferenceInterneAndTypeAudience(referenceInterne, type)
            .map(suivi -> {
                repository.delete(suivi);
                return true;
            })
            .orElse(false);
    }
    
    /**
     * Supprime tous les suivis d'un dossier
     */
    public void deleteAllSuivisByDossier(String referenceInterne) {
        List<SuiviJuridique> suivis = repository.findByReferenceInterneOrderByDateAudienceDesc(referenceInterne);
        repository.deleteAll(suivis);
    }
    
    /**
     * Crée ou met à jour un suivi (méthode utilitaire)
     */
    public SuiviJuridique createOrUpdate(SuiviJuridique suivi) {
        validateSuivi(suivi);
        
        SuiviJuridiqueId id = new SuiviJuridiqueId(
            suivi.getReferenceInterne(),
            suivi.getReferenceExterne(),
            suivi.getTypeAudience()
        );
        
        return repository.findById(id)
            .map(existing -> {
                // Update
                existing.setJugement(suivi.getJugement());
                existing.setDateAudience(suivi.getDateAudience());
                return repository.save(existing);
            })
            .orElseGet(() -> {
                // Create
                return repository.save(suivi);
            });
    }

    // ==================== MÉTHODES DE VALIDATION ====================
    
    /**
     * Valide les données d'un suivi avant création/modification
     * @throws IllegalArgumentException si validation échoue
     */
    private void validateSuivi(SuiviJuridique suivi) {
        if (suivi.getReferenceInterne() == null || suivi.getReferenceInterne().isBlank()) {
            throw new IllegalArgumentException("La référence interne est obligatoire");
        }
        
        if (suivi.getReferenceExterne() == null || suivi.getReferenceExterne().isBlank()) {
            throw new IllegalArgumentException("La référence externe est obligatoire");
        }
        
        if (suivi.getTypeAudience() == null) {
            throw new IllegalArgumentException("Le type d'audience est obligatoire");
        }
        
        // Validation supplémentaire : la date d'audience ne peut pas être dans le futur ? (optionnel)
        // if (suivi.getDateAudience() != null && suivi.getDateAudience().isAfter(LocalDate.now())) {
        //     throw new IllegalArgumentException("La date d'audience ne peut pas être dans le futur");
        // }
    }
}



/*
 * Version 1
 

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
    
    // Nouvelle méthode save (pour updateSuiviJuridique)
    public SuiviJuridique save(SuiviJuridique suivi) {
        return repository.save(suivi);
    }
    
    

   
}*/