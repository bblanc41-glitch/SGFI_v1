package com.sgifbackend.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "suivis_juridiques")
@IdClass(SuiviJuridiqueId.class)
public class SuiviJuridique implements Serializable {
	
	private static final long serialVersionUID = 1L;

    @Id
    @Column(name = "reference_interne", nullable = false)
    private String referenceInterne;  // référence du dossier

    @Id
    @Column(name = "reference_externe", nullable = false)
    private String referenceExterne;  // numéro dossier tribunal

    @Id
    @Enumerated(EnumType.STRING)
    @Column(name = "type_audience", nullable = false)
    private TypeAudience typeAudience;

    @Column(columnDefinition = "TEXT")
    private String jugement;

    @Column(name = "date_audience")
    private LocalDate dateAudience;

    @CreationTimestamp
    @Column(name = "date_creation", updatable = false)
    private LocalDateTime dateCreation;

    @UpdateTimestamp
    @Column(name = "date_modification")
    private LocalDateTime dateModification;
    
    
    // Champs pour la gestion des alerte 
    @Column(name = "dateDerniereRelance")
    private LocalDate dateDerniereRelance;  // Date de la dernière relance à l'avocat

    @Column(name = "delaiActif")
    private Boolean delaiActif = true;      // true = délai en cours, false = délai terminé
    
}