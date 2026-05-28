import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DossierService } from '../../services/dossier.service';
import { Dossier, getBadgeClass, getLibelle, PieceJointe } from '../../models/dossier';
import { SuiviJuridique } from '../../models/suivi-juridique';
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
  fichierUpload: File | null = null;
  uploadMessage = '';
  pieces: PieceJointe[] = [];

  // Workflow
  statutSelectionne: string = '';
  transitions: string[] = [];
  motifRequis: string = '';
  showMotifField: boolean = false;

  // Visualisation des pièces jointes
  modalVisible = false;
  modalSafeUrl: SafeResourceUrl | null = null;
  modalType: 'image' | 'pdf' | 'autre' = 'autre';
  modalNomFichier: string = '';

  // Suivi juridique (liste)
  suivis: SuiviJuridique[] = [];
  typeAudienceOptions = ['INSTANCE', 'APPEL', 'CASSATION'];
  suiviEnEdition: SuiviJuridique | null = null;   // suivi en cours de modification
  nouveauSuivi: SuiviJuridique = {
    referenceInterne: '',
    referenceExterne: '',
    typeAudience: 'INSTANCE',
    jugement: '',
    dateAudience: ''
  };

  erreurSuivi: string = '';
  showForm: boolean = false;
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
        console.log('Référence interne reçue :', data.referenceInterne); // ← debug
        if (this.dossier?.referenceInterne) {
          this.chargerSuivis();   // ← déplacez l’appel ici
        } else {
          console.warn('Pas de référence interne pour ce dossier');
        }
        this.mettreAJourTransitions();
        //this.chargerSuivis();
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

  // ---------- SUIVI JURIDIQUE ----------
  chargerSuivis(): void {
    if (this.dossier?.referenceInterne) {
      this.dossierService.getSuivis(this.dossier.referenceInterne).subscribe({
        next: (data) => {
          this.suivis = data.sort((a, b) => {
            if (!a.dateAudience && !b.dateAudience) return 0;
            if (!a.dateAudience) return 1;
            if (!b.dateAudience) return -1;
            return new Date(b.dateAudience).getTime() - new Date(a.dateAudience).getTime();
          });
         this.cdr.detectChanges();   
        },
        error: (err) => console.error(err)
      });
    }
  }


  // Afficher formulaire pour ajout
afficherFormulaireAjout(): void {
  this.annulerEdition();        // nettoie tout
  this.showForm = true;
  this.erreurSuivi = '';
}

// Surcharge de editerSuivi (existante) – on garde la même logique mais on met showForm = true
editerSuivi(suivi: SuiviJuridique): void {
  this.suiviEnEdition = { ...suivi };
  this.nouveauSuivi = { ...suivi };
  this.showForm = true;
  this.erreurSuivi = '';
}

/////////////////////////////
// Méthode pour ajouter un suivi
ajouterSuivi(): void {
  if (!this.dossier?.referenceInterne) return;

  const suivi = this.nouveauSuivi;
  if (!suivi.referenceExterne?.trim()) {
    this.erreurSuivi = 'La référence externe est obligatoire.';
    return;
  }

  // Vérifier si un suivi du même type existe déjà
  if (this.suivis.some(s => s.typeAudience === suivi.typeAudience)) {
    this.erreurSuivi = `Un suivi pour le type ${suivi.typeAudience} existe déjà.`;
    return;
  }

  this.dossierService.createSuivi(this.dossier.referenceInterne, suivi).subscribe({
    next: () => {
      this.chargerSuivis();
      this.annulerEdition();   // ferme le formulaire et réinitialise
      this.erreurSuivi = '';
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error(err);
      this.erreurSuivi = err.error?.message || 'Erreur lors de l\'ajout.';
      this.cdr.detectChanges();
    }
  });
}


// Méthode pour modifier un suivi
modifierSuivi(): void {
  if (!this.dossier?.referenceInterne || !this.suiviEnEdition) return;

  const suivi = {
    referenceInterne: this.dossier.referenceInterne,
    referenceExterne: this.nouveauSuivi.referenceExterne,
    typeAudience: this.nouveauSuivi.typeAudience,
    jugement: this.nouveauSuivi.jugement,
    dateAudience: this.nouveauSuivi.dateAudience
  };

  if (!suivi.referenceExterne?.trim()) {
    this.erreurSuivi = 'La référence externe est obligatoire.';
    return;
  }

  // IMPORTANT : Utiliser updateSuivi (PUT) et non addOrUpdateSuivi (POST)
  this.dossierService.updateSuivi(this.dossier.referenceInterne, suivi).subscribe({
    next: () => {
      this.chargerSuivis();
      this.annulerEdition();
      this.erreurSuivi = '';
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Erreur modification:', err);
      this.erreurSuivi = err.error?.message || 'Erreur lors de la modification.';
      this.cdr.detectChanges();
    }
  });
}


// Réinitialisation du formulaire (existante)
annulerEdition(): void {
  this.suiviEnEdition = null;
  this.nouveauSuivi = {
    referenceInterne: this.dossier?.referenceInterne || '',
    referenceExterne: '',
    typeAudience: 'INSTANCE',
    jugement: '',
    dateAudience: ''
  };
  this.showForm = false;
  this.erreurSuivi = '';
}

    // Au lieu de passer seulement typeAudience, passer aussi referenceExterne
supprimerSuivi(suivi: SuiviJuridique): void {
  if (!this.dossier?.referenceInterne) return;
  if (confirm(`Supprimer le suivi pour ${suivi.typeAudience} ?`)) {
    this.dossierService.deleteSuivi(
      this.dossier.referenceInterne, 
      suivi.referenceExterne,  // ← AJOUTER la référence externe
      suivi.typeAudience
    ).subscribe({
      next: () => this.chargerSuivis(),
      error: (err) => console.error(err)
    });
  }
}

  // ---------- WORKFLOW ----------
  tousLesStatuts: string[] = [
    'IMPORTE_CCR', 'EN_ATTENTE_PRISE_EN_CHARGE', 'EN_ATTENTE_VALIDATION',
    'INCOMPLET', 'VALIDE_POUR_TRANSMISSION', 'ENVOYE_AVOCAT',
    'EN_INSTANCE', 'EN_APPEL', 'EN_CASSATION', 'CLOTURE'
  ];

  mettreAJourTransitions(): void {
    if (this.dossier && this.dossier.statut) {
      this.transitions = this.tousLesStatuts.filter(s => s !== this.dossier!.statut);
      this.statutSelectionne = this.transitions[0] || '';
      this.onStatutChange();
    }
  }

  changerStatut(nouveauStatut: string, motif?: string): void {
    this.dossierService.changerStatut(this.dossierId, nouveauStatut, motif).subscribe({
      next: () => this.chargerDossier(),
      error: (err) => alert("Erreur : " + (err.error?.message || err.message))
    });
  }

  onStatutChange(): void {
    this.showMotifField = (this.statutSelectionne === 'CLOTURE' || this.statutSelectionne === 'INCOMPLET');
    if (!this.showMotifField) this.motifRequis = '';
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
    this.motifRequis = '';
    this.showMotifField = false;
  }

  // ---------- AUTRES MÉTHODES (inchangées) ----------
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
    this.dossierService.update(this.dossierId, this.formModif.value).subscribe({
      next: (updated) => {
        this.dossier = updated;
        this.modeEdition = false;
        this.chargerDossier();
      },
      error: (err) => alert("Erreur lors de la modification")
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) this.fichierUpload = input.files[0];
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
      error: (err) => this.uploadMessage = "Erreur upload : " + (err.error?.message || err.message)
    });
  }

  chargerListeFichiers(): void {
    this.dossierService.getPieces(this.dossierId).subscribe({
      next: (data) => this.pieces = data,
      error: (err) => console.error(err)
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

  fermerModal(): void {
    this.modalVisible = false;
    this.modalSafeUrl = null;
  }

  genererBordereau(): void {
    this.dossierService.genererBordereau(this.dossierId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bordereau_${this.dossier?.referenceInterne}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => alert('Impossible de générer le bordereau.')
    });
  }

  getBadgeClass(statut?: string) { return getBadgeClass(statut); }
  getLibelle(statut?: string) { return getLibelle(statut); }
}