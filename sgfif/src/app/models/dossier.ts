/**
 * Correspond à l'entité JPA Dossier.java
 */
export interface Dossier {
  idDossier?:             number;
  ip:                     string;
  numeroFacture:          string;
  beneficiaire?:          string;
  cin?:                   string;
  telephone?:             string;
  statut?:                string;
  motif?:                 string;
  referenceInterne?:      string;
  bordereau?:             string;
  jugement?:              string;
  dateAudience?:          string;
  observationJuridique?:  string;
  dateCreation?:          string;
  dateMiseAJour?:         string;
}

//Correspond à l'entité JPA HistoriqueDossier.java

export interface HistoriqueDossier {
  id?:           number;
  ancienStatut?: string;
  nouveauStatut: string;
  auteur?:       string;
  commentaire?:  string;
  dateAction?:   string;
}

//Réponse de l'endpoint GET /api/dossiers/stats
 
export interface Stats {
  total:        number;
  enAttente:    number;
  envoyeAvocat: number;
  enInstance:   number;
  cloture:      number;
  incomplet:    number;
}

// Rapport renvoyé après une importation CCR
 
export interface RapportImport {
  importes: number;
  doublons: number;
  erreurs:  number;
  details:  string[];
}

//Tous les statuts possibles (enum Statut.java côté backend)

export const STATUTS: { valeur: string; libelle: string; badge: string }[] = [
  { valeur: 'IMPORTE_CCR',                   libelle: 'Importé CCR',                    badge: 'bg-info text-dark' },
  { valeur: 'EN_ATTENTE_PRISE_EN_CHARGE',    libelle: 'En attente de prise en charge',  badge: 'bg-warning text-dark' },
  { valeur: 'EN_ATTENTE_VALIDATION',         libelle: 'En attente de validation',       badge: 'bg-warning text-dark' },
  { valeur: 'INCOMPLET',                     libelle: 'Incomplet',                      badge: 'bg-danger' },
  { valeur: 'VALIDE_POUR_TRANSMISSION',      libelle: 'Validé pour transmission',       badge: 'bg-primary' },
  { valeur: 'ENVOYE_AVOCAT',                 libelle: 'Envoyé à l\'avocat',             badge: 'bg-primary' },
  { valeur: 'EN_INSTANCE',                   libelle: 'En instance',                    badge: 'bg-secondary' },
  { valeur: 'EN_APPEL',                      libelle: 'En appel',                       badge: 'bg-secondary' },
  { valeur: 'EN_CASSATION',                  libelle: 'En cassation',                   badge: 'bg-dark' },
  { valeur: 'CLOTURE',                       libelle: 'Clôturé',                        badge: 'bg-success' },
];

/** Retourne la classe Bootstrap badge correspondant à un statut */
export function getBadgeClass(statut?: string): string {
  return STATUTS.find(s => s.valeur === statut)?.badge ?? 'bg-secondary';
}

/** Retourne le libellé lisible d'un statut */
export function getLibelle(statut?: string): string {
  return STATUTS.find(s => s.valeur === statut)?.libelle ?? statut ?? '—';
}
/*export interface Dossier {
  idDossier?:            number;   // Généré par le serveur (AUTO_INCREMENT)
  ip:                    string;   // Identifiant Patient — obligatoire (clé composite)
  numeroFacture:         string;   // Numéro de facture  — obligatoire (clé composite)
  beneficiaire?:         string;   // Nom du patient (colonne ajoutée dans le SQL v2)
  telephone?:            string;
  statut?:               string;   // 'en attente de prise en charge' par défaut
  referenceInterne?:     string;
  observationJuridique?: string;
}*/
