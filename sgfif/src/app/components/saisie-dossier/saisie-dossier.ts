import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DossierService } from '../../services/dossier.service';
import { Dossier } from '../../models/dossier';

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
  imports:     [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './saisie-dossier.html',
  styleUrl:    './saisie-dossier.css',
})
export class SaisieDossier {

  form: FormGroup;
  chargement   = false;
  succes       = false;
  erreurMessage = '';

  constructor(
    private fb:             FormBuilder,
    private dossierService: DossierService,
    private router:         Router,
  ) {
    this.form = this.fb.group({
      // ── Champs obligatoires (clé composite ip + numeroFacture) ─────────
      ip: ['', [Validators.required, Validators.maxLength(30)]],
      // ↑ Identifiant Patient — clé métier côté backend

      numeroFacture: ['', [Validators.required, Validators.maxLength(30)]],
      // ↑ Numéro de facture — clé métier côté backend

      // ── Champs optionnels ──────────────────────────────────────────────
      beneficiaire: ['', Validators.maxLength(150)],
      cin:          ['', Validators.maxLength(20)],
      telephone:    ['', Validators.maxLength(20)],
      observationJuridique: [''],
      // ↑ Zone de texte libre pour les notes du Service Juridique

      // ── Champs NON saisis ici (gérés par le backend) ──────────────────
      // statut          → EN_ATTENTE_PRISE_EN_CHARGE (auto)
      // referenceInterne → REF-JUR-YYYY-NNNN (auto)
      // jugement, dateAudience, bordereau → remplis plus tard dans le workflow
      // motif → utilisé uniquement lors d'un changement de statut (CLOTURE/INCOMPLET)
    });
  }

  // Accesseurs pour les messages de validation dans le template
  get ip()            { return this.form.get('ip'); }
  get numeroFacture() { return this.form.get('numeroFacture'); }

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
      numeroFacture:        this.form.value.numeroFacture.trim(),
      beneficiaire:         this.form.value.beneficiaire?.trim() || undefined,
      cin:                  this.form.value.cin?.trim()          || undefined,
      telephone:            this.form.value.telephone?.trim()    || undefined,
      observationJuridique: this.form.value.observationJuridique?.trim() || undefined,
    };

    this.dossierService.creer(dossier as Dossier).subscribe({
      next: (dossierCree) => {
        this.chargement = false;
        this.succes     = true;
        // Redirection vers la liste après 1,5 secondes
        setTimeout(() => this.router.navigate(['/liste-dossiers']), 1500);
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