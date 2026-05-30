package com.sgifbackend.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "dossiers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor 
public class Dossier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idDossier;

    //////////// Cle metier composite
    @Column(nullable = false)
    private String ip;                      // Identifiant Patient

     //////////// Informations patient (dupliquées pour accès rapide) 
	// Nouveaux champs issus du canevas
	private String hopital;                 // Hôpital concerné (HME, HOS, etc.) 
    private String beneficiaire;
    private String adresseVille;            // Adresse/Ville
    private String cin;
    private String telephone;
    
    @Column(name = "dateD")
    private LocalDate dateD;   // Date début séjour
    @Column(name = "dateF")
    private LocalDate dateF;   // Date fin séjour
    
    @Column(nullable = false)
    private String numeroFacture;           // Numero de facture
    private BigDecimal montant;
    
    @Column(name = "paiement")
    private BigDecimal paiement;
    
    @Column(name = "rap")
    private BigDecimal rap;    // Reste À Payer
 
    
    ////////////  Workflow 
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Statut statut = Statut.EN_ATTENTE_PRISE_EN_CHARGE;

    // Raison de cloture ou d'incomplete (obligatoire selon le statut)
    @Column(columnDefinition = "TEXT")
    private String motif;

    ////////// Rererences internes
    @Column(name = "reference_interne", unique = true)
    private String referenceInterne;        // Ex : REF-JUR-2024-001
    
    // Ref pour suivi du dossier auprès de l'avocat On suppose que la reference est unique mais les numeros auprès des differentes juridiction sont =/=
     @Column(name = "reference_externe", length = 50)
    private String referenceExterne;
    
    // Nom du fichier bordereau PDF généré lors de l'envoi à l'avocat
    private String bordereau;

    //////////Suivi judiciaire
    //private String jugement;               // 1re instance / Appel / Cassation
    //private String dateAudience;           // Format libre (ex : 15/07/2024)
    
	private String sujetAffaire;            // Frais de traitement, Chèque sans provision, Faute médicale, Dde constat de décès, Autres
	private String annee;                   // Année de l'affaire
	private String typeAffaireJudiciaire;   // Civil, Administratif, Pénal, Autres
	//private String refDossierAvocat;        // Référence dossier (donnée par l'avocat)
	//private LocalDate dateReceptionAvocat;  // Date réception par l'avocat
	//private String numDossierTribunal1ere;  // N° dossier au tribunal 1ère instance
	//private String jugement1ereInstance;    // Jugement 1ère instance
	//private String numDossierCourAppel;     // N° dossier à la Cour d'Appel
	//private String jugementCourAppel;       // Jugement Cour d'Appel
	//private String numDossierCourCassation; // N° dossier à la Cour de Cassation
	//private String jugementCourCassation;   // Jugement Cour de Cassation
	//private String paiementFraisAvocat;     // Paiement frais Avocat (oui/non, montant, etc.)
	
    
	//Relances
    @Column(name = "relance1")
    private long relance1;

    @Column(name = "dateRelance1")
    private Date dateRelance1;
    
    @Column(name = "relance2")
    private long relance2;
    
    @Column(name = "dateRelance2")
    private Date dateRelance2;
    
   /* @Column(name = "observation")
    private String observation;*/
	
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
	//////////Relation vers les données brutes CCR permettant la saisait 
	@OneToOne
	@JoinColumns(value = {
	 @JoinColumn(name = "ip",            referencedColumnName = "ip",            insertable = false, updatable = false),
	 @JoinColumn(name = "numeroFacture", referencedColumnName = "numeroFacture", insertable = false, updatable = false)
	}, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT)) // <-- LA LIGNE MAGIQUE ICI
	@NotFound(action = NotFoundAction.IGNORE)   // ← AJOUTER CETTE LIGNE
	private DossierImport infosOrigine;
	
    /*@OneToOne
    @JoinColumns({
        @JoinColumn(name = "ip",            referencedColumnName = "ip",            insertable = false, updatable = false),
        @JoinColumn(name = "numeroFacture", referencedColumnName = "numeroFacture", insertable = false, updatable = false)
    })
    private DossierImport infosOrigine;*/

    /////////////Historique des actions
    @OneToMany(mappedBy = "dossier", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<HistoriqueDossier> historique = new ArrayList<>();
}