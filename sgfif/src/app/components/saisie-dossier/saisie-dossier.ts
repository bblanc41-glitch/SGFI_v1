/*a decommenter

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
}*/