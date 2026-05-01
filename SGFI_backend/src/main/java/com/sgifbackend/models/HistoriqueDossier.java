package com.sgifbackend.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Trace chaque changement d'état d'un dossier.
 * Remplace les triggers SQL MySQL mentionnés dans le cahier des charges
 * par une solution portable gérée par l'application.
 */
@Entity
@Table(name = "historique_dossiers")
@Data
@NoArgsConstructor
public class HistoriqueDossier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_dossier", nullable = false)
    private Dossier dossier;

    @Enumerated(EnumType.STRING)
    private Statut ancienStatut;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Statut nouveauStatut;

    /** Utilisateur qui a effectué l'action */
    private String auteur;

    @Column(columnDefinition = "TEXT")
    private String commentaire;

    @CreationTimestamp
    private LocalDateTime dateAction;

    public HistoriqueDossier(Dossier dossier, Statut ancien, Statut nouveau, String auteur, String commentaire) {
        this.dossier     = dossier;
        this.ancienStatut = ancien;
        this.nouveauStatut = nouveau;
        this.auteur       = auteur;
        this.commentaire  = commentaire;
    }
}