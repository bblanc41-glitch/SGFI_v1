import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DossierService } from '../../services/dossier.service';
import { Dossier, getBadgeClass, getLibelle, PieceJointe } from '../../models/dossier';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-detail-dossier',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './detail-dossier.html',
  styleUrls: ['./detail-dossier.css']
})
export class DetailDossier implements OnInit {
  dossierId!: number;
  dossier: Dossier | null = null;
  modeEdition = false;      // false = consultation, true = modification
  chargement = true;
  erreur = '';
  fichiers: { nom: string; url: string }[] = [];
  fichierUpload: File | null = null;
  uploadMessage = '';
  pieces: PieceJointe[] = [];
  formModif: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dossierService: DossierService,
    private authService: AuthService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.formModif = this.fb.group({
      beneficiaire: [''],
      cin: [''],
      telephone: [''],
      observationJuridique: ['']
    });
  }

  ngOnInit(): void {
    this.dossierId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.dossierId) {
      this.erreur = "ID de dossier manquant";
      this.chargement = false;
      return;
    }
    this.chargerDossier();
    this.chargerListeFichiers();
  }

  chargerDossier(): void {
    this.dossierService.getById(this.dossierId).subscribe({
      next: (data) => {
        this.dossier = data;
        this.formModif.patchValue({
          beneficiaire: data.beneficiaire || '',
          cin: data.cin || '',
          telephone: data.telephone || '',
          observationJuridique: data.observationJuridique || ''
        });
        this.chargement = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.erreur = "Impossible de charger le dossier";
        this.chargement = false;
        console.error(err);
      }
    });
  }

  basculerEdition(): void {
    this.modeEdition = !this.modeEdition;
    if (!this.modeEdition) {
      // annuler les modifications
      if (this.dossier) {
        this.formModif.patchValue({
          beneficiaire: this.dossier.beneficiaire || '',
          cin: this.dossier.cin || '',
          telephone: this.dossier.telephone || '',
          observationJuridique: this.dossier.observationJuridique || ''
        });
      }
    }
  }

  enregistrerModifications(): void {
    if (!this.dossier) return;
    const patch = this.formModif.value;
    this.dossierService.update(this.dossierId, patch).subscribe({
      next: (updated) => {
        this.dossier = updated;
        this.modeEdition = false;
        this.chargerDossier(); // recharge pour afficher les nouvelles valeurs
      },
      error: (err) => {
        console.error(err);
        alert("Erreur lors de la modification");
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.fichierUpload = input.files[0];
    }
  }

  uploadPiece(): void {
    if (!this.fichierUpload) return;
    const formData = new FormData();
    formData.append('file', this.fichierUpload);
    this.dossierService.uploadPiece(this.dossierId, formData).subscribe({
      next: (res) => {
        this.uploadMessage = "Fichier uploadé avec succès";
        this.fichierUpload = null;
        // Optionnel : recharger la liste
      },
      error: (err) => {
        this.uploadMessage = "Erreur upload : " + (err.error?.message || err.message);
      }
    });
  }

  cloturer(): void {
    const motif = prompt("Motif de clôture (obligatoire) :");
    if (!motif || motif.trim() === '') {
      alert("Un motif est requis.");
      return;
    }
    this.dossierService.changerStatut(this.dossierId, 'CLOTURE', motif).subscribe({
      next: () => {
        alert("Dossier clôturé");
        this.chargerDossier(); // rafraîchir
      },
      error: (err) => console.error(err)
    });
  }

  getBadgeClass(statut?: string) { return getBadgeClass(statut); }
  getLibelle(statut?: string) { return getLibelle(statut); }

  //Pieces jointes
chargerListeFichiers(): void {
  this.dossierService.getPieces(this.dossierId).subscribe({
    next: (data: PieceJointe[]) => { this.pieces = data; },
    error: (err: any) => console.error(err)
  });
}

/*independament de la data
chargerListeFichiers(): void {
  this.dossierService.getPieces(this.dossierId).subscribe({
    next: (data) => { this.pieces = data; },
    error: (err) => console.error(err)
  });
}
 */


telechargerPiece(chemin: string, nom: string): void {
  this.dossierService.downloadPiece(this.dossierId, chemin).subscribe(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nom;
    a.click();
    window.URL.revokeObjectURL(url);
  });
}

supprimerPiece(id: number, chemin: string): void {
  if (confirm('Supprimer ce fichier ?')) {
    this.dossierService.deletePiece(this.dossierId, id).subscribe(() => {
      this.pieces = this.pieces.filter(p => p.id !== id);
    });
  }
}
  



}