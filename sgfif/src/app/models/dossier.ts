export interface Dossier {
  idDossier?:             number;
  referenceInterne?:      string;
  
  ip:                     string;
  beneficiaire?:          string;
  cin?:                   string;
  
  // Soins
  dateDebut:      string;
  dateFin:        string;

  // Facture
  pole:           string;
  numeroFacture:  string;
  montant:        number;
  paiements:      number;
  rap:            number;

  // Relances
  relance1?:      number;
  dateRelance1?:  string;
  relance2?:      number;
  dateRelance2?:  string;

  //telephone?:             string;
  
  statut?:                string;
  observationJuridique?:  string;
  
  //motif?:                 string;
  //bordereau?:             string;
  //jugement?:              string;
  //dateAudience?:          string;
  
    // Workflow
  dateCreation?:          string;
  dateMiseAJour?:         string;
}

//Dossier importe
export interface DossierImport {
  idDossier?:             number;
  referenceInterne?:      string;
  
  ip:                     string;
  beneficiaire?:          string;
  cin?:                   string;
  
  // Soins
  dateDebut:      string;
  dateFin:        string;

  // Facture
  numeroFacture:  string;
  montant:        number;
  paiements:      number;
  rap:            number;

  // Relances
  relance1?:      number;
  dateRelance1?:  string;
  relance2?:      number;
  dateRelance2?:  string;

  statut?:                string;
  observationJuridique?:  string;
  
  // Workflow
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


// ── INTERFACE DOSSIER RÉCENT ─────────────────────────────────────────────────
// Projection allégée pour le tableau du dashboard — inclut le montant du CCR
export interface DossierRecent {
  idDossier:         number;
  ip:                string;
  numeroFacture:     string;
  beneficiaire?:     string;
  statut?:           string;
  referenceInterne?: string;
  montant?:          number;  // ← vient de DossierImport.montant via @OneToOne
}

// ── INTERFACE STATS Global ──────────────────────────────────────────────────────────
//   V1 : enAttente, clotures, montantImpaye
//   V2 : total, envoyeAvocat, enInstance, cloture, incomplet
export interface Stats {
  total:         number;  // Tous les dossiers confondus
  enAttente:     number;  // Statut "en attente de prise en charge" ou "Importé CCR"
  envoyeAvocat:  number;  // Statut "Envoyé à avocat" ou "Valider pour transmission"
  enInstance:    number;  // Statut "En instance" / "Appel" / "Cassation"
  cloture:       number;  // Statut "Clôturé"
  incomplet:     number;  // Statut "Incomplet"
  montantImpaye: number;  // Somme des RAP (Reste À Payer) de tous les dossiers actifs
}


//Réponse de l'endpoint GET /api/dossiers/stats

// Rapport renvoyé après une importation CCR
 
export interface RapportImport {
  importes: number;
  doublons: number;
  erreurs:  number;
  details:  string[];
}


// ── NOTIFICATION ─────────────────────────────────────────────────────────────
// Alerte générée automatiquement (échéance proche, dossier incomplet…)
export interface Notification {
  id:      number;
  message: string;
  date:    string;
  lue:     boolean;  // false = non lue → comptée dans notifCount
}
 

//Tous les statuts possibles (enum Statut.java côté backend)
/*
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
];*/

// Utilisé par getBadgeClass() et getLibelle() dans tous les composants
export const STATUTS: { valeur: string; libelle: string; badge: string }[] = [
  { valeur: 'IMPORTE_CCR',                libelle: 'Importé CCR',                   badge: 'bg-info text-dark'    },
  { valeur: 'EN_ATTENTE_PRISE_EN_CHARGE', libelle: 'En attente de prise en charge', badge: 'bg-warning text-dark' },
  { valeur: 'EN_ATTENTE_VALIDATION',      libelle: 'En attente de validation',      badge: 'bg-warning text-dark' },
  { valeur: 'INCOMPLET',                  libelle: 'Incomplet',                     badge: 'bg-danger'            },
  { valeur: 'VALIDE_POUR_TRANSMISSION',   libelle: 'Validé pour transmission',      badge: 'bg-primary'           },
  { valeur: 'ENVOYE_AVOCAT',             libelle: 'Envoyé à l\'avocat',            badge: 'bg-primary'           },
  { valeur: 'EN_INSTANCE',               libelle: 'En instance',                   badge: 'bg-secondary'         },
  { valeur: 'EN_APPEL',                  libelle: 'En appel',                      badge: 'bg-secondary'         },
  { valeur: 'EN_CASSATION',              libelle: 'En cassation',                  badge: 'bg-dark'              },
  { valeur: 'CLOTURE',                   libelle: 'Clôturé',                       badge: 'bg-success'           },
];




/** Retourne la classe Bootstrap badge correspondant à un statut */
export function getBadgeClass(statut?: string): string {
  return STATUTS.find(s => s.valeur === statut)?.badge ?? 'bg-secondary';
}

/**^^^^^^^^^^^^^^^^^^^^^^
 * Retourne le libellé lisible d'un statut technique
 * ex: 'ENVOYE_AVOCAT' → 'Envoyé à l\'avocat'
 
export function getLibelle(statut: string): string {
  const libelles: Record<string, string> = {
    'Importé CCR':                    'Importé CCR',
    'en attente de prise en charge':  'En attente',
    'Valider pour transmission':      'Validé — transmission',
    'Envoyé à avocat':                'Envoyé à l\'avocat',
    'En instance':                    'En instance',
    'Appel':                          'Appel',
    'Cassation':                      'Cassation',
    'Clôturé':                        'Clôturé',
    'Incomplet':                      'Incomplet',
  };
  return libelles[statut] ?? statut;
}*/



/** Retourne le libellé lisible d'un statut */
export function getLibelle(statut?: string): string {
  return STATUTS.find(s => s.valeur === statut)?.libelle ?? statut ?? '—';
}

 
/**^^^^^^^^^^^^^^
 * Retourne la classe CSS Bootstrap du badge selon le statut
 
export function getBadgeClass(statut: string): string {
  const classes: Record<string, string> = {
    'Importé CCR':                   'bg-secondary',
    'en attente de prise en charge': 'bg-warning text-dark',
    'Valider pour transmission':     'bg-primary',
    'Envoyé à avocat':               'bg-info text-dark',
    'En instance':                   'bg-secondary',
    'Appel':                         'bg-purple',
    'Cassation':                     'bg-danger',
    'Clôturé':                       'bg-success',
    'Incomplet':                     'bg-danger',
  };
  return classes[statut] ?? 'bg-secondary';
}*/












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
