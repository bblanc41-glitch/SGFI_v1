import { Component, OnInit,ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { DossierService } from '../../services/dossier.service';
import { Dossier } from '../../models/dossier';

import { FormGroupDirective } from '@angular/forms';
import { ViewChild } from '@angular/core';

// Angular Material imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';


/**
 * Composant Saisie Manuelle — crée un dossier via POST /api/dossiers.
 *
 * Champs envoyés : ip, numeroFacture, beneficiaire, cin, telephone, observationJuridique.
 * Le backend (DossierService.creer) gère automatiquement :
 *   - referenceInterne (REF-JUR-YYYY-NNNN)
 *   - statut (EN_ATTENTE_PRISE_EN_CHARGE)
 *   - dateCreation / dateMiseAJour
 *   - enregistrement dans l'historique
 */
@Component({
  selector:    'app-saisie-dossier',
  standalone:  true,
  imports:     [CommonModule, ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule,MatSelectModule],
  templateUrl: './saisie-dossier.html',
  styleUrl:    './saisie-dossier.css',
})
export class SaisieDossier {

  form: FormGroup;
  chargement   = false;
  fichierselected: File[] = [];
  succes       = false;
  erreurMessage = '';

  //pour stocker les infos renvoyées par le backend
  dossierEnregistre: Dossier | null = null;
  estModifier = false;

  poles = [  'Hôpital des Spécialités', 'Hôpital Mère-Enfant',
    'Hôpital d’Oncologie', 'Hôpital Ibn Al Hassan', 'Hôpital Omar Drissi'
  ];

  constructor(
    private fb:             FormBuilder,
    private dossierService: DossierService,
    private router:         Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      // ── Champs obligatoires (clé composite ip + numeroFacture) ─────────
      ip: ['', [Validators.required, Validators.maxLength(30)]],
      // ↑ Identifiant Patient — clé métier côté backend

      // ── Champs optionnels ──────────────────────────────────────────────
      beneficiaire: ['', Validators.maxLength(150)],
      cin:          ['', Validators.maxLength(20)],
      telephone:    ['', Validators.maxLength(20)],

      pole:          ['', Validators.required],
      dateDebut:     ['', Validators.required],
      dateFin:       ['', Validators.required],
      
      numeroFacture: ['', [Validators.required, Validators.maxLength(30)]],
      // ↑ Numéro de facture — clé métier côté backend
      montant:       [null, [Validators.required, Validators.min(0)]],
      paiements:     [0],
      rap:           [{ value: 0, disabled: true }],
    

      relance1: [''],
      dateRelance1: [''],
      relance2: [''],
      dateRelance2: [''],
      observationJuridique: [''],
            // ↑ Zone de texte libre pour les notes du Service Juridique
            
      // ── Champs NON saisis ici (gérés par le backend) ──────────────────
      // statut          → EN_ATTENTE_PRISE_EN_CHARGE (auto)
      // referenceInterne → REF-JUR-YYYY-NNNN (auto)
      // jugement, dateAudience, bordereau → remplis plus tard dans le workflow
      // motif → utilisé uniquement lors d'un changement de statut (CLOTURE/INCOMPLET)
    });

    // Auto-calculate RAP = montant - paiements
    this.form.get('montant')?.valueChanges.subscribe(() => this.calculerRap());
    this.form.get('paiements')?.valueChanges.subscribe(() => this.calculerRap());




  }

  // Accesseurs pour les messages de validation dans le template
  get ip()            { return this.form.get('ip'); }
  get numeroFacture() { return this.form.get('numeroFacture'); }


  calculerRap(): void {
    let montant   = this.form.get('montant')?.value   || 0;
    if(montant<0){ montant = - montant;}
    let paiements = this.form.get('paiements')?.value || 0;
    if(paiements <0){paiements = - paiements} 
    const resultat = (montant< paiements ? 0 : montant - paiements);
    this.form.get('rap')?.setValue(resultat, { emitEvent: false });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      // ↑ Déclenche l'affichage des erreurs de validation sur tous les champs
      return;
    }

    this.chargement   = true;
    this.erreurMessage = '';

    // On n'envoie que les champs du formulaire (pas statut, pas référence)
    const dossier: Partial<Dossier> = {
      ip:                   this.form.value.ip.trim(),
      beneficiaire:         this.form.value.beneficiaire?.trim() || undefined,
      cin:                  this.form.value.cin?.trim()          || undefined,
      //telephone:            this.form.value.telephone?.trim()    || undefined,
      observationJuridique: this.form.value.observationJuridique?.trim() || undefined,
      pole:          this.form.value.trim(),
      dateDebut:     this.form.value.trim(),
      dateFin:       this.form.value.trim(),
      
      numeroFacture: this.form.value.trim(),
      montant:       this.form.value.trim(),
      paiements:    this.form.value.trim(),
      rap:           this.form.value.trim(),
    

      relance1: this.form.value.trim(),
      dateRelance1: this.form.value.trim(),
      relance2: this.form.value.trim(),
      dateRelance2:this.form.value.trim(),
    };

    this.dossierService.creer(dossier as Dossier).subscribe({
      next: (dossierCree) => {
        this.chargement = false;
        this.succes     = true;
        //setTimeout(() => this.router.navigate(['/liste-dossiers']), 1500);// Redirection vers la liste après 1,5 secondes

        this.dossierEnregistre = dossierCree;//initialisation du dossierEnregistrer pour le recap
        
      },
      error: (err) => {
        this.chargement = false;
        if (err.status === 409) {
          // HTTP 409 Conflict = doublon (même IP + même numéro de facture)
          this.erreurMessage = 'Un dossier existe déjà pour cet IP et ce numéro de facture.';
        } else if (err.status === 401) {
          this.router.navigate(['/login']);
        } else {
          this.erreurMessage = 'Erreur lors de l\'enregistrement. Vérifiez la connexion au serveur.';
        }
      }
    });
  }

  // Action 1 : Enregistrer un autre dossier
  recommencerSaisie(): void {
    this.form.reset();
    this.succes            = false;
    this.erreurMessage     = '';
    this.dossierEnregistre = null;
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

   ChangerFicher(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) this.addFiles(Array.from(input.files));
  }

   onFileDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files) this.addFiles(Array.from(event.dataTransfer.files));
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

  // Action 2 : Modifier le dossier (Placeholder)
  modifierDossier(): void {
    if (this.dossierEnregistre && this.dossierEnregistre.idDossier) {
       // Si tu as une route de modification, ce sera :
       // this.router.navigate(['/modifier-dossier', this.dossierEnregistre.idDossier]);
       alert('Fonctionnalité de modification à venir pour le dossier N° ' + this.dossierEnregistre.idDossier);
    }
  }

  onReset(): void {
    this.form.reset();
    this.succes        = false;
    this.erreurMessage = '';
  }


}

/*a Version 1

import { Component } from '@angular/core';
//import { Auth } from '../../services/auth';  // AuthService ??
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Indispensable pour [(ngModel)] sinon erreurs
import { CommonModule } from '@angular/common';
import { DossierService } from '../../services/dossier.service';
import { Dossier } from '../../models/dossier';



@Component({
  selector: 'app-saisie-dossier',

  standalone: true, // Angular moderne utilise le mode standalone pour l'autonomie et la gestion besoins propres a chaque composants : c'est l'independance
  imports: [FormsModule,CommonModule],

  templateUrl: './saisie-dossier.html',
  styleUrl: './saisie-dossier.css',
})

export class SaisieDossier {
  // Initialisation de l'objet selon le modèle
    nouveauDossier: Dossier = {
    ip:                   '',
    numeroFacture:        '',
    beneficiaire:         '',
    telephone:            '',
    statut:               'en attente de prise en charge',
    referenceInterne:     '',
    observationJuridique: ''
  };

  constructor(private dossierService: DossierService, private router: Router) {}
 
  validerSaisie() {
    // ip et numeroFacture sont les clés métier — les deux sont obligatoires
    if (!this.nouveauDossier.ip || !this.nouveauDossier.numeroFacture) {
      alert("L'Identifiant Patient (IP) et le Numéro de Facture sont obligatoires.");
      return;
    }

    this.dossierService.enregistrerDossier(this.nouveauDossier).subscribe({
      next: () => {
        alert('Dossier enregistré avec succès !');
        this.router.navigate(['/liste-dossiers']);
      },
      error: (err :any) => {
        console.error(err);
        if (err.status === 401) {
          alert('Session expirée. Veuillez vous reconnecter.');
          this.router.navigate(['/login']);
        } else {
          alert("Erreur lors de l'enregistrement. Vérifiez la connexion au serveur.");
        }
      }
    });
  }
}       */