import { Component, ChangeDetectorRef  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink,Router } from '@angular/router';
import { DossierService } from '../../services/dossier.service';
import { RapportImport } from '../../models/dossier';

/**
 * Composant Importation CCR — envoi du fichier Excel via POST /api/importation.
 * Reçoit un RapportImport { importes, doublons, erreurs, details[] }.
 */
@Component({
  selector:    'app-importation',
  standalone:  true,
  imports:     [CommonModule, RouterLink],
  templateUrl: './importation.html',
  styleUrl:    './importation.css',
})
export class Importation {

  fichierSelectionne: File | null = null;
  chargement  = false;
  rapport:      RapportImport | null = null;
  erreurServeur = '';

  constructor(private dossierService: DossierService,
              private router: Router,
              private cdr: ChangeDetectorRef) {}

  onFichierSelectionne(event: Event): void {
    const input = event.target as HTMLInputElement;
    const fichier = input.files?.[0] ?? null;

    // Réinitialise à chaque nouvelle sélection
    this.rapport       = null;
    this.erreurServeur = '';

    if (fichier && !fichier.name.endsWith('.xlsx')) {
      this.erreurServeur = 'Seuls les fichiers .xlsx sont acceptés.';
      this.fichierSelectionne = null;
      input.value = '';
      return;
    }
    this.fichierSelectionne = fichier;
  }

  lancerImportation(): void {
    if (!this.fichierSelectionne) {
      this.erreurServeur = 'Veuillez sélectionner un fichier Excel (.xlsx).';
      return;
    }

    this.chargement    = true;
    this.rapport       = null;
    this.erreurServeur = '';

    const formData = new FormData();
    formData.append('file', this.fichierSelectionne);
    // ↑ "file" doit correspondre au @RequestParam("file") de ImportationController.java

    this.dossierService.importerCcr(formData).subscribe({
      next: (rapport) => {
        this.rapport    = rapport;
        this.chargement = false;
        // Réinitialise la sélection de fichier après succès
        this.fichierSelectionne = null;
         this.cdr.detectChanges();
      },
      error: (err) => {
        this.chargement = false;
        if (err.status === 401) {
          this.erreurServeur = 'Session expirée. Veuillez vous reconnecter.';
        } else {
          this.erreurServeur = 'Erreur lors de l\'importation. Vérifiez le serveur.';
        }
      }
    });
  }

  reinitialiser(): void {
    this.fichierSelectionne = null;
    this.rapport            = null;
    this.erreurServeur      = '';
  }

  // Calcule si l'importation a réussi (au moins 1 dossier importé)
  get importationReussie(): boolean {
    return !!this.rapport && this.rapport.importes > 0;
  }
}