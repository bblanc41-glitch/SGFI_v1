package com.sgifbackend.models;

// Cycle de vie complet d'un dossier SGFI.
 
public enum Statut {

    // Phase 1 — Initialisation
    IMPORTE_CCR("Importé CCR"),
    EN_ATTENTE_PRISE_EN_CHARGE("En attente de prise en charge"),
    EN_ATTENTE_VALIDATION("En attente de validation"),
    INCOMPLET("Incomplet"),// — pièces manquantes
    VALIDE_POUR_TRANSMISSION("Validé pour transmission"),

    // Phase 2 — Action civile
    ENVOYE_AVOCAT("Envoyé à l'avocat"),

    // Phase 3 — Suivi judiciaire
    EN_INSTANCE("En instance"),
    EN_APPEL("En appel"),
    EN_CASSATION("En cassation"),

    // Phase 4 — Clôture
    CLOTURE("Clôturé");

    private final String libelle;

    Statut(String libelle) { this.libelle = libelle; }
    public String getLibelle() { return libelle; }
}