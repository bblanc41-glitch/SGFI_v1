package com.sgifbackend.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;


@Entity
@Table(name = "historique_dossiers")
//@Data Pas de @Data : évite toString() récursif avec Dossier.
@Getter
@NoArgsConstructor
public class HistoriqueDossier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_dossier", nullable = false)
    @JsonIgnore //pour  éviter la récursion infinie lors de la sérialisation
    private Dossier dossier;

    @Enumerated(EnumType.STRING)
    @Column(name = "ancien_statut", length = 50)
    private Statut ancienStatut;

    @Enumerated(EnumType.STRING)
    @Column(name = "nouveau_statut", nullable = false, length = 50)
    private Statut nouveauStatut;

    // Username de l'agent — extrait du token JWT par le contrôleur 
    private String auteur;

    @Column(columnDefinition = "TEXT")
    private String commentaire;

    @CreationTimestamp
    @Column(name = "date_action", updatable = false)
    private LocalDateTime dateAction;

    public HistoriqueDossier(Dossier dossier, Statut ancien, Statut nouveau,
    		String auteur, String commentaire) {
		this.dossier       = dossier;
		this.ancienStatut  = ancien;
		this.nouveauStatut = nouveau;
		this.auteur        = auteur;
		this.commentaire   = commentaire;
		}
}