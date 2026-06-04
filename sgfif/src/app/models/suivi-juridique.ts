export interface SuiviJuridique {
  referenceInterne: string;      // clé étrangère vers Dossier
  referenceExterne: string;      // numéro dossier tribunal
  typeAudience: 'INSTANCE' | 'APPEL' | 'CASSATION';
  jugement?: string;
  dateAudience?: string;          // format YYYY-MM-DD
  dateCreation?: string;
  dateModification?: string;
   //Pour gestion des alertes
  dateDerniereRelance?: string;  // ← AJOUTER
  delaiActif?: boolean;           // ← AJOUTER
  joursRestants?: number;         // ← AJOUTER (calculé côté frontend)
}