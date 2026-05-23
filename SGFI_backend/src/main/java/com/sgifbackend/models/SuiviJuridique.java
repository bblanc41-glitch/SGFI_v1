package com.sgifbackend.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "suivis_juridiques")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuiviJuridique {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idSuivi;

    @Column(name = "reference_interne", unique = true, nullable = false)
    private String referenceInterne;   // clé unique liée à Dossier

    @Column(name = "reference_externe")
    private String referenceExterne;   // référence tribunal/avocat variable suivant les juridictions( Intance, Appel ou Cassation)

    @Enumerated(EnumType.STRING)
    @Column(name = "type_audience")
    private TypeAudience typeAudience;

    @Column(columnDefinition = "TEXT")
    private String jugement;

    @CreationTimestamp
    @Column(name = "date_creation", updatable = false)
    private LocalDateTime dateCreation;

    @UpdateTimestamp
    @Column(name = "date_modification")
    private LocalDateTime dateModification;
}