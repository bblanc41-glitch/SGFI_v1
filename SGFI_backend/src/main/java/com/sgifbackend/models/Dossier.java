package com.sgifbackend.models;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "dossiers")
@Data
public class Dossier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idDossier;

    //////////// Cle metier composite
    @Column(nullable = false)
    private String ip;                      // Identifiant Patient

    @Column(nullable = false)
    private String numeroFacture;           // Numero de facture

    //////////// Informations patient (dupliquées pour accès rapide) 
    private String beneficiaire;
    private String cin;
    private String telephone;

    ////////////  Workflow 
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Statut statut = Statut.EN_ATTENTE_PRISE_EN_CHARGE;

    /** Raison de cloture ou d'incomplete (obligatoire selon le statut) */
    @Column(columnDefinition = "TEXT")
    private String motif;

    ////////// Rererences internes
    @Column(unique = true)
    private String referenceInterne;        // Ex : REF-JUR-2024-001

    /* Nom du fichier bordereau PDF généré lors de l'envoi à l'avocat */
    private String bordereau;

    //////////Suivi judiciaire
    private String jugement;               // 1re instance / Appel / Cassation
    private String dateAudience;           // Format libre (ex : 15/07/2024)

    ////////// Observations 
    @Column(columnDefinition = "TEXT")
    private String observationJuridique;

    //////////Horodatage
    @CreationTimestamp
    private LocalDateTime dateCreation;

    @UpdateTimestamp
    private LocalDateTime dateMiseAJour;

    ////////// Relation vers les données brutes CCR
    /**
     * Liaison logique en lecture seule avec la table dossiersImportes.
     * insertable/updatable = false : ip et numeroFacture déjà mappés ci-dessus.
     */
    @OneToOne
    @JoinColumns({
        @JoinColumn(name = "ip",            referencedColumnName = "ip",            insertable = false, updatable = false),
        @JoinColumn(name = "numeroFacture", referencedColumnName = "numeroFacture", insertable = false, updatable = false)
    })
    private DossierImport infosOrigine;

    /////////////Historique des actions
    @OneToMany(mappedBy = "dossier", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<HistoriqueDossier> historique = new ArrayList<>();
}