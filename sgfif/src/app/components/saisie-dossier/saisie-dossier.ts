import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { DossierService } from '../../services/dossier.service';
import { Dossier } from '../../models/dossier';

// Angular Material imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-saisie-dossier',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './saisie-dossier.html',
  styleUrl: './saisie-dossier.css',
})
export class SaisieDossier {
  form: FormGroup;
  chargement = false;
  fichierselected: File[] = [];
  succes = false;
  erreurMessage = '';
  dossierEnregistre: Dossier | null = null;
  estModifier = false;

  poles = [
    'Hôpital des Spécialités',
    'Hôpital Mère-Enfant',
    'Hôpital d\'Oncologie',
    'Hôpital Ibn Al Hassan',
    'Hôpital Omar Drissi'
  ];

  constructor(
    private fb: FormBuilder,
    private dossierService: DossierService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      // Champs obligatoires
      ip: ['', [Validators.required, Validators.maxLength(30)]],
      numeroFacture: ['', [Validators.required, Validators.maxLength(30)]],

      // Identification patient
      beneficiaire: ['', Validators.maxLength(150)],
      cin: ['', Validators.maxLength(20)],
      telephone: ['', Validators.maxLength(20)],

      // Séjour
      pole: ['', Validators.required],
      dateDebut: ['', Validators.required],
      dateFin: ['', Validators.required],

      // Facture
      montant: [null, [Validators.required, Validators.min(0)]],
      paiement: [0, [Validators.min(0)]],  // ← CHANGÉ : paiements → paiement
      rap: [{ value: 0, disabled: true }],

      // Relances
      relance1: [''],
      dateRelance1: [''],
      relance2: [''],
      dateRelance2: [''],

      // Observation
      observationJuridique: ['']
    });

    // Auto-calcul du RAP
    this.form.get('montant')?.valueChanges.subscribe(() => this.calculerRap());
    this.form.get('paiement')?.valueChanges.subscribe(() => this.calculerRap());  // ← CHANGÉ
  }

  get ip() { return this.form.get('ip'); }
  get numeroFacture() { return this.form.get('numeroFacture'); }

  calculerRap(): void {
  let montant = this.form.get('montant')?.value || 0;
  if (montant < 0) { montant = -montant; }
  let paiement = this.form.get('paiement')?.value || 0;  // ← CHANGÉ : paiements → paiement
  if (paiement < 0) { paiement = -paiement; }
  const resultat = (montant < paiement ? 0 : montant - paiement);
  this.form.get('rap')?.setValue(resultat, { emitEvent: false });
}


onSubmit(): void {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  this.chargement = true;
  this.erreurMessage = '';

  const formValues = this.form.value;
  
  const dossier: Partial<Dossier> = {
    ip: formValues.ip ? String(formValues.ip).trim() : '',
    numeroFacture: formValues.numeroFacture ? String(formValues.numeroFacture).trim() : '',
    beneficiaire: formValues.beneficiaire ? String(formValues.beneficiaire).trim() : '',
    cin: formValues.cin ? String(formValues.cin).trim() : '',
    telephone: formValues.telephone ? String(formValues.telephone).trim() : '',
    pole: formValues.pole || '',
    dateDebut: formValues.dateDebut || '',
    dateFin: formValues.dateFin || '',
    montant: formValues.montant || 0,
    paiement: formValues.paiement || 0,  // ← CHANGÉ
    rap: this.form.get('rap')?.value || 0,
    relance1: formValues.relance1 ? Number(formValues.relance1) : undefined,
    dateRelance1: formValues.dateRelance1 || '',
    relance2: formValues.relance2 ? Number(formValues.relance2) : undefined,
    dateRelance2: formValues.dateRelance2 || '',
    observationJuridique: formValues.observationJuridique ? String(formValues.observationJuridique).trim() : ''
  };

  console.log('Envoi du dossier:', dossier);

  this.dossierService.creer(dossier as Dossier).subscribe({
    next: (dossierCree) => {
      this.chargement = false;
      this.succes = true;
      this.dossierEnregistre = dossierCree;
      this.cdr.detectChanges();
    },
    error: (err) => {
      this.chargement = false;
      console.error('Erreur:', err);
      if (err.status === 409) {
        this.erreurMessage = 'Un dossier existe déjà pour cet IP et ce numéro de facture.';
      } else if (err.status === 401) {
        this.erreurMessage = 'Session expirée. Veuillez vous reconnecter.';
        setTimeout(() => this.router.navigate(['/login']), 3000);
      } else if (err.status === 0) {
        this.erreurMessage = 'Impossible de joindre le serveur. Vérifiez que Spring Boot tourne sur le port 8080.';
      } else {
        this.erreurMessage = `Erreur ${err.status}: ${err.error?.message || 'Erreur lors de l\'enregistrement.'}`;
      }
      this.cdr.detectChanges();
    }
  });
}

  /*
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.chargement = true;
    this.erreurMessage = '';

    // Récupération des valeurs SANS trim() sur les nombres
    const formValues = this.form.value;
    
    const dossier: Partial<Dossier> = {
      ip: formValues.ip ? String(formValues.ip).trim() : '',
      numeroFacture: formValues.numeroFacture ? String(formValues.numeroFacture).trim() : '',
      beneficiaire: formValues.beneficiaire ? String(formValues.beneficiaire).trim() : '',
      cin: formValues.cin ? String(formValues.cin).trim() : '',
      telephone: formValues.telephone ? String(formValues.telephone).trim() : '',
      pole: formValues.pole || '',
      dateDebut: formValues.dateDebut || '',
      dateFin: formValues.dateFin || '',
      montant: formValues.montant || 0,
      paiements: formValues.paiements || 0,
      rap: this.form.get('rap')?.value || 0,
      relance1: formValues.relance1 ? String(formValues.relance1).trim() : '',
      dateRelance1: formValues.dateRelance1 || '',
      relance2: formValues.relance2 ? String(formValues.relance2).trim() : '',
      dateRelance2: formValues.dateRelance2 || '',
      observationJuridique: formValues.observationJuridique ? String(formValues.observationJuridique).trim() : ''
    };

    console.log('Envoi du dossier:', dossier);

    this.dossierService.creer(dossier as Dossier).subscribe({
      next: (dossierCree) => {
        this.chargement = false;
        this.succes = true;
        this.dossierEnregistre = dossierCree;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.chargement = false;
        console.error('Erreur:', err);
        if (err.status === 409) {
          this.erreurMessage = 'Un dossier existe déjà pour cet IP et ce numéro de facture.';
        } else if (err.status === 401) {
          this.erreurMessage = 'Session expirée. Veuillez vous reconnecter.';
          setTimeout(() => this.router.navigate(['/login']), 3000);
        } else if (err.status === 0) {
          this.erreurMessage = 'Impossible de joindre le serveur. Vérifiez que Spring Boot tourne sur le port 8080.';
        } else {
          this.erreurMessage = `Erreur ${err.status}: ${err.error?.message || 'Erreur lors de l\'enregistrement.'}`;
        }
        this.cdr.detectChanges();
      }
    });
  }*/

  recommencerSaisie(): void {
    this.form.reset();
    this.succes = false;
    this.erreurMessage = '';
    this.dossierEnregistre = null;
    this.form.patchValue({ paiements: 0, rap: 0 });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      this.addFiles(Array.from(event.dataTransfer.files));
    }
  }

  addFiles(files: File[]): void {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    files.forEach(f => {
      if (allowed.includes(f.type) && !this.fichierselected.find(x => x.name === f.name)) {
        this.fichierselected.push(f);
      }
    });
  }

  removeFile(index: number): void {
    this.fichierselected.splice(index, 1);
  }

  modifierDossier(): void {
    if (this.dossierEnregistre && this.dossierEnregistre.idDossier) {
      this.router.navigate(['/dossier-detail', this.dossierEnregistre.idDossier]);
    }
  }

  onReset(): void {
    this.form.reset();
    this.succes = false;
    this.erreurMessage = '';
    this.form.patchValue({ paiements: 0, rap: 0 });
  }



    /* A modifier
   onSaveDraft(): void {
    this.chargement = true;
    const payload = { ...this.form.getRawValue(), statut: 'En attente de prise en charge' };
    this.dossierService.creer(payload).subscribe({
      next: (res) => {
        this.chargement        = false;
        this.success = `Brouillon enregistré. Référence : ${res.reference}`;
        this.erreurMessage  = '';
        this.resetForm();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: () => {
        this.chargement      = false;
        this.erreurMessage= 'Erreur lors de l\'enregistrement.';
         window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
  
     onValidate(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.erreurMessage = 'Veuillez remplir tous les champs obligatoires.';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    this.chargement = true;
    const payload = { ...this.form.getRawValue(), statut: 'Valider pour transmission' };

        const request$ = this.estModifier && this.dossierId
        ? this.dossierService.update(this.dossierId, payload)
       : this.dossierService.creer(payload);

       request$.subscribe({
      next: (res) => {
        if (this.fichierselected.length > 0) {
          this.dossierService.uploadPieces(res.id, this.fichierselected).subscribe();
        }
        this.chargement        = false;
         
         this.success = this.estModifier
         ? `Dossier modifié ! Référence : ${res.reference}`
         : `Dossier validé ! Référence : ${res.reference}`;
         this.erreurMessage   = '';
         if (!this.estModifier) this.onReset();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.cdr.detectChanges();
      },
      error: () => {
        this.chargement      = false;
        this.erreurMessage = 'Erreur lors de la validation du dossier.';
         window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }*/


}