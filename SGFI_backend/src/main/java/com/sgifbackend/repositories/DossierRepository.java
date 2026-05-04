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

    //List<Dossier> findByStatut(Statut statut);
	 // Filtre par statut — utilisé par getParStatut() du service Angular
    List<Dossier> findByStatutOrderByDateMiseAJourDesc(Statut statut);
 
    // Vérifie l'existence d'un dossier (doublon) avant création
    boolean existsByIpAndNumeroFacture(String ip, String numeroFacture);
 
	
    // Recherche multi-critères : IP, bénéficiaire, CIN, référence interne, téléphone
    @Query("""
        SELECT d FROM Dossier d
        WHERE LOWER(d.ip)               LIKE LOWER(CONCAT('%', :terme, '%'))
           OR LOWER(d.beneficiaire)     LIKE LOWER(CONCAT('%', :terme, '%'))
           OR LOWER(d.cin)              LIKE LOWER(CONCAT('%', :terme, '%'))
           OR LOWER(d.referenceInterne) LIKE LOWER(CONCAT('%', :terme, '%'))
           OR LOWER(d.telephone)        LIKE LOWER(CONCAT('%', :terme, '%'))
        ORDER BY d.dateMiseAJour DESC
        """)
    List<Dossier> rechercher(@Param("terme") String terme);
    
    // 5 derniers dossiers modifiés — pour le tableau du dashboard
    List<Dossier> findTop5ByOrderByDateMiseAJourDesc();
 
    // Compte par statut — pour les statistiques du dashboard
    long countByStatut(Statut statut);
}