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
 

    @Column(name = "numeroFacture") private String numeroFacture;


    private BigDecimal montant;
    private BigDecimal paiement;

    @Column(name = "RAP")
    private BigDecimal rap;    // Reste À Payer
 
    //Relances
    @Column(name = "relance1")
    private long relance1;

    @Column(name = "dateRelance1")
    private Date dateRelance1;
    
    @Column(name = "relance2")
    private long relance2;
    
    @Column(name = "dateRelance2")
    private Date dateRelance2;
    
    @Column(name = "observation")
    private String observation;
    
    @CreationTimestamp
    @Column(name = "date_importation", updatable = false)
    private LocalDateTime dateImportation;
}