package com.sgifbackend.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Date;

import org.hibernate.annotations.CreationTimestamp;

//Données brutes importées depuis le fichier Excel CCR.
 //Table en lecture seule pour le service juridique.Liée à Dossier via @OneToOne (ip + numeroFacture).

@Entity
@Data
@NoArgsConstructor
@Table(
    name = "dossiersImportes",
    uniqueConstraints = @UniqueConstraint(columnNames = {"ip", "numeroFacture"})
)
public class DossierImport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idImport;

    @Column(nullable = false)
    private String ip;

    private String beneficiaire;
    private String cin;
    
    @Column(name = "dateD")
    private LocalDate dateD;   // Date début séjour
 
    @Column(name = "dateF")
    private LocalDate dateF;   // Date fin séjour
 

    @Column(nullable = false)
    private String numeroFacture;

    private BigDecimal montant;
    private BigDecimal paiement;

    @Column(name = "RAP")
    private BigDecimal RAP;    // Reste À Payer
 
    //Relances
    private long relance1;
    private Date dateRelance1;
    private long relance2;
    private Date dateRelance2;
    
    @CreationTimestamp
    @Column(name = "date_importation", updatable = false)
    private LocalDateTime dateImportation;
}