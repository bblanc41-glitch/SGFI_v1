import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DossierService } from '../../services/dossier.service';
import { Dossier, getBadgeClass, getLibelle, PieceJointe } from '../../models/dossier';
import { AuthService } from '../../services/auth.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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
  modeEdition = false;
  chargement = true;
  erreur = '';
  fichiers: { nom: string; url: string }[] = [];
  fichierUpload: File | null = null;
  uploadMessage = '';
  pieces: PieceJointe[] = [];

  // Workflow : liste déroulante
  statutSelectionne: string = '';
  transitions: string[] = [];

  motifRequis: string = '';
  showMotifField: boolean = false;

  // Visualisation des pièces jointes
  modalVisible = false;
  modalBlobUrl: string | null = null;
  modalSafeUrl: SafeResourceUrl | null = null;
  modalType: 'image' | 'pdf' | 'autre' = 'autre';

  formModif: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dossierService: DossierService,
    private authService: AuthService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
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
        this.mettreAJourTransitions();   // met à jour la liste des transitions possibles
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

  // ──────────────────────────────────────────────────────────────
  // WORKFLOW – Gestion des transitions
  // ──────────────────────────────────────────────────────────────


 // Propriétés
tousLesStatuts: string[] = [
  'IMPORTE_CCR',
  'EN_ATTENTE_PRISE_EN_CHARGE',
  'EN_ATTENTE_VALIDATION',
  'INCOMPLET',
  'VALIDE_POUR_TRANSMISSION',
  'ENVOYE_AVOCAT',
  'EN_INSTANCE',
  'EN_APPEL',
  'EN_CASSATION',
  'CLOTURE'
];

// Méthode pour mettre à jour la liste déroulante (tous sauf le statut actuel)
mettreAJourTransitions(): void {
  if (this.dossier && this.dossier.statut) {
    this.transitions = this.tousLesStatuts.filter(s => s !== this.dossier!.statut);
    this.statutSelectionne = this.transitions[0] || '';
    this.onStatutChange(); // ← ajouter
  }
}

/*mettreAJourTransitions(): void {
  if (this.dossier && this.dossier.statut) {
    this.transitions = this.tousLesStatuts.filter(s => s !== this.dossier!.statut);
    this.statutSelectionne = this.transitions[0] || '';
  }
}*/

  changerStatut(nouveauStatut: string, motif?: string): void {
    this.dossierService.changerStatut(this.dossierId, nouveauStatut, motif).subscribe({
      next: () => {
        this.chargerDossier(); // rechargement complet
      },
      error: (err) => {
        console.error(err);
        alert("Erreur lors du changement de statut : " + (err.error?.message || err.message));
      }
    });
  }

  onStatutChange(): void {
  this.showMotifField = (this.statutSelectionne === 'CLOTURE' || this.statutSelectionne === 'INCOMPLET');
  if (!this.showMotifField) {
    this.motifRequis = '';
  }
}

appliquerChangementStatut(): void {
  if (!this.statutSelectionne) return;
  let motif: string | undefined = undefined;
  if (this.showMotifField) {
    if (!this.motifRequis.trim()) {
      alert(`Un motif est requis pour passer en ${this.statutSelectionne}.`);
      return;
    }
    motif = this.motifRequis.trim();
  }
  this.changerStatut(this.statutSelectionne, motif);
  // Réinitialiser le champ après application
  this.motifRequis = '';
  this.showMotifField = false;
}

  /*appliquerChangementStatut(): void {
  if (!this.statutSelectionne) return;
  let motif: string | undefined = undefined;
  if (this.statutSelectionne === 'CLOTURE' || this.statutSelectionne === 'INCOMPLET') {
    const libelle = this.statutSelectionne === 'CLOTURE' ? 'clôture' : 'incomplétude';
    const reponse = prompt(`Motif de ${libelle} (obligatoire) :`);
    if (reponse === null) return; // l'utilisateur a annulé
    if (!reponse.trim()) {
      alert(`Un motif est requis pour passer en ${this.statutSelectionne}.`);
      return;
    }
    motif = reponse.trim();
  }
  this.changerStatut(this.statutSelectionne, motif);
}*/

  // ──────────────────────────────────────────────────────────────
  // Édition et pièces jointes (inchangé)
  // ──────────────────────────────────────────────────────────────

  basculerEdition(): void {
    this.modeEdition = !this.modeEdition;
    if (!this.modeEdition && this.dossier) {
      this.formModif.patchValue({
        beneficiaire: this.dossier.beneficiaire || '',
        cin: this.dossier.cin || '',
        telephone: this.dossier.telephone || '',
        observationJuridique: this.dossier.observationJuridique || ''
      });
    }
  }

  enregistrerModifications(): void {
    if (!this.dossier) return;
    const patch = this.formModif.value;
    this.dossierService.update(this.dossierId, patch).subscribe({
      next: (updated) => {
        this.dossier = updated;
        this.modeEdition = false;
        this.chargerDossier();
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
      next: () => {
        this.uploadMessage = "Fichier uploadé avec succès";
        this.fichierUpload = null;
        this.chargerListeFichiers();
      },
      error: (err) => {
        this.uploadMessage = "Erreur upload : " + (err.error?.message || err.message);
      }
    });
  }

  chargerListeFichiers(): void {
    this.dossierService.getPieces(this.dossierId).subscribe({
      next: (data: PieceJointe[]) => { this.pieces = data; },
      error: (err: any) => console.error(err)
    });
  }

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

  supprimerPiece(id: number): void {
    if (confirm('Supprimer ce fichier ?')) {
      this.dossierService.deletePiece(this.dossierId, id).subscribe(() => {
        this.pieces = this.pieces.filter(p => p.id !== id);
      });
    }
  }


 // Visualisation des pièces jointes

 modalNomFichier: string = '';
/*version 2
 voirPiece(chemin: string, nom: string): void {
  this.dossierService.downloadPiece(this.dossierId, chemin).subscribe(blob => {
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Libérer l’URL après un court délai (pour éviter une fuite mémoire)
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
  });
}*/


voirPiece(chemin: string, nom: string): void {
  const extension = nom.split('.').pop()?.toLowerCase();
  this.modalNomFichier = nom;
  this.dossierService.downloadPiece(this.dossierId, chemin).subscribe(blob => {
    const url = window.URL.createObjectURL(blob);
    this.modalSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.modalType = ['jpg','jpeg','png','gif','bmp','webp'].includes(extension || '') ? 'image'
                    : extension === 'pdf' ? 'pdf' : 'autre';
    this.modalVisible = true;
  });
}
/*Version 1

voirPiece(chemin: string, nom: string): void {
  const extension = nom.split('.').pop()?.toLowerCase();
  this.dossierService.downloadPiece(this.dossierId, chemin).subscribe(blob => {
    // Créer l'URL blob
    this.modalBlobUrl = window.URL.createObjectURL(blob);
    // La rendre "sûre" pour Angular
    this.modalSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.modalBlobUrl);
    // Déterminer le type d'affichage
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '')) {
      this.modalType = 'image';
    } else if (extension === 'pdf') {
      this.modalType = 'pdf';
    } else {
      this.modalType = 'autre';
    }
    this.modalVisible = true;
    this.cdr.detectChanges();  // ← force la mise à jour pour éviter l'erreur NG0100
  });
}*/


fermerModal(): void {
  this.modalVisible = false;
  if (this.modalSafeUrl) {
    // On ne peut pas révoquer directement l'URL car elle est emballée, mais on peut stocker l'URL brute si besoin
  }
}
/*
fermerModal(): void {
  if (this.modalBlobUrl) {
    window.URL.revokeObjectURL(this.modalBlobUrl);
    this.modalBlobUrl = null;
  }
  this.modalVisible = false;
  this.modalSafeUrl = null;
}*/

  /////////////////: Generer Bordereau
 genererBordereau(): void {
  this.dossierService.genererBordereau(this.dossierId).subscribe({
    next: (blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bordereau_${this.dossier?.referenceInterne}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    error: (err: any) => {
      console.error('Erreur génération bordereau', err);
      alert('Impossible de générer le bordereau.');
    }
  });
}



  getBadgeClass(statut?: string) { return getBadgeClass(statut); }
  getLibelle(statut?: string) { return getLibelle(statut); }
}