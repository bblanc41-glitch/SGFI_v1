package com.sgifbackend.models;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Date;

/**
 Données brutes importées depuis le fichier Excel CCR.
 Table en lecture seule pour le service juridique.
 */
@Entity
@Data
@Table(name = "dossiers_importes", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"ip", "numeroFacture"})
})
public class DossierImport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idImport;

    @Column(nullable = false)
    private String ip;

    private String beneficiaire;
    private String cin;
    private LocalDate dateD;        // Début de séjour
    private LocalDate dateF;        // Fin de séjour

    @Column(nullable = false)
    private String numeroFacture;

    private BigDecimal montant;
    private BigDecimal paiement;

    @Column(name = "rap")
    private BigDecimal RAP;          // Reste à payer
    
    //Relances
    private long relance1;
    private Date dateRelance1;
    private long relance2;
    private Date dateRelance2;
}