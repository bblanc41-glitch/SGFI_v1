export interface SuiviJuridique {
  referenceInterne: string;      // clé étrangère vers Dossier
  referenceExterne: string;      // numéro dossier tribunal
  typeAudience: 'INSTANCE' | 'APPEL' | 'CASSATION';
  jugement?: string;
  dateAudience?: string;          // format YYYY-MM-DD
  dateCreation?: string;
  dateModification?: string;
}