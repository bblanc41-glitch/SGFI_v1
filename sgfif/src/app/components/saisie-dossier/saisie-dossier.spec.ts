// src/app/components/saisie-dossier/saisie-dossier.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DossierService } from '../../services/dossier.service';
import { Dossier } from '../../models/dossier';

@Component({
  selector:    'app-saisie-dossier',
  standalone:  true,
  imports:     [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './saisie-dossier.html',
  styleUrl:    './saisie-dossier.css',
})
export class SaisieDossier {

  form: FormGroup;
  chargement    = false;
  succes        = false;
  erreurMessage = '';

  constructor(
    private fb:             FormBuilder,
    private dossierService: DossierService,
    private router:         Router,
  ) {
    this.form = this.fb.group({
      ip:                   ['', [Validators.required, Validators.maxLength(30)]],
      numeroFacture:        ['', [Validators.required, Validators.maxLength(30)]],
      beneficiaire:         ['', Validators.maxLength(150)],
      cin:                  ['', Validators.maxLength(20)],
      telephone:            ['', Validators.maxLength(20)],
      observationJuridique: [''],
    });
  }

  get ip()            { return this.form.get('ip'); }
  get numeroFacture() { return this.form.get('numeroFacture'); }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.chargement    = true;
    this.erreurMessage = '';

    const dossier: Partial<Dossier> = {
      ip:                   this.form.value.ip.trim(),
      numeroFacture:        this.form.value.numeroFacture.trim(),
      beneficiaire:         this.form.value.beneficiaire?.trim()          || undefined,
      cin:                  this.form.value.cin?.trim()                   || undefined,
      telephone:            this.form.value.telephone?.trim()             || undefined,
      observationJuridique: this.form.value.observationJuridique?.trim() || undefined,
    };

    // DIAGNOSTIC — ouvrez F12 > Console avant de cliquer Enregistrer
    console.log('[Saisie] Token présent ?',
      localStorage.getItem('token') ? 'OUI' : 'NON — CAUSE DU 401 !');

    this.dossierService.creer(dossier as Dossier).subscribe({
      next: (dossierCree) => {
        this.chargement = false;
        this.succes     = true;
        setTimeout(() => this.router.navigate(['/liste-dossiers']), 1500);
      },
      error: (err) => {
        this.chargement = false;
        // DIAGNOSTIC — le vrai code d'erreur apparaît ici dans la console
        console.error('[Saisie] Erreur HTTP reçue :', err.status, err.error);

        if (err.status === 409) {
          this.erreurMessage = 'Un dossier existe déjà pour cet IP et ce numéro de facture.';
        } else if (err.status === 401) {
          // Vérifiez dans F12 > Console si le token était présent ou absent
          this.erreurMessage = `Erreur 401 — Token présent au moment de l'envoi : ${!!localStorage.getItem('token')}. Redirection dans 3 secondes…`;
          setTimeout(() => this.router.navigate(['/login']), 3000);
        } else if (err.status === 0) {
          this.erreurMessage = 'Impossible de joindre le serveur. Vérifiez que Spring Boot tourne sur le port 8080.';
        } else {
          this.erreurMessage = `Erreur ${err.status} : ${err.error?.message || 'Voir la console F12 pour les détails.'}`;
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