export interface SuiviJuridique {
  idSuivi?: number;
  referenceInterne?: string;   // ← devient optionnel
  referenceExterne?: string;
  typeAudience?: 'INSTANCE' | 'APPEL' | 'CASSATION';
  jugement?: string;
  dateCreation?: string;
  dateModification?: string;
}