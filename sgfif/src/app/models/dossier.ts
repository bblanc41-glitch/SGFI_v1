
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
  paiement:      number;
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



export interface Dossier {
  idDossier?:             number;
  referenceInterne?:      string;
  
  ip:                     string;
  beneficiaire?:          string;
  cin?:                   string;
  telephone?:             string;
  
  // Soins
  dateDebut:      string;
  dateFin:        string;

  // Facture
  pole:           string;
  numeroFacture:  string;
  montant:        number;
  paiement:      number;
  rap:            number;

  // Relances
  relance1?:      number;
  dateRelance1?:  string;
  relance2?:      number;
  dateRelance2?:  string;

  
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
  dateLimiteAction?: string;
  dateMiseAJour?:    string;
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


// SUJET DE DOSSIER OBJET POUR TRAITEMENT
export const SUJET: { valeur: string; libelle: string; badge: string }[] = [
  { valeur: 'FRAIS_DE_TRAITEMENT',           libelle: 'Frais de traitement',     badge: 'bg-info text-dark'    },
  { valeur: 'CHEQUE_SANS_PROVISION',         libelle: 'Chèque sans provision',   badge: 'bg-warning text-dark' },
  { valeur: 'FAUTE_MEDICALE',                libelle: 'Faute médicale',          badge: 'bg-warning text-dark' },
  { valeur: 'DEMANDE_DE_CONSTAT_DE_DECES',   libelle: 'Demande constat de décès',badge: 'bg-danger'            },
  { valeur: 'AUTRE',                         libelle: 'autre',                   badge: 'bg-primary'           },
];


//TYPE AFFAIRE JUDICICIAIRE
export const TYPE_AFFAIRE: { valeur: string; libelle: string; badge: string }[] = [
  { valeur: 'CIVIL',           libelle: 'Civil',     badge: 'bg-info text-dark'    },
  { valeur: 'ADMINISTRATIF',         libelle: 'Administratif',   badge: 'bg-warning text-dark' },
  { valeur: 'PENAL',                libelle: 'Pénal',          badge: 'bg-warning text-dark' },
  { valeur: 'AUTRE',                         libelle: 'autre',                   badge: 'bg-primary'           },
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



export interface PieceJointe {
  id: number;
  nomFichier: string;
  cheminStockage: string;
  taille: number;
  dateUpload: string;   // ou Date selon ce que renvoie le backend
}

//Notifications

export interface Notification {
  id: number;
  message: string;
  type: string;
  idDossier?: number;
  lu: boolean;
  dateCreation: string;
}




