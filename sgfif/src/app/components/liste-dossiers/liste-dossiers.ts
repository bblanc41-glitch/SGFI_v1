import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { DossierService }    from '../../services/dossier.service';
import { Dossier, getBadgeClass, getLibelle } from '../../models/dossier';

@Component({
  selector: 'app-liste-dossiers',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './liste-dossiers.html',
  styleUrl: './liste-dossiers.css',
})
export class ListeDossiers implements OnInit {
  dossiers : Dossier[] = [];
  recherche: string = ''; // Propriété liée à la barre de recherche ([(ngModel)])
   chargement: boolean   = true;

 // Raccourcis template — gèrent les enums (CLOTURE, EN_INSTANCE…)
  getBadgeClass = getBadgeClass;
  getLibelle    = getLibelle;
 
  constructor(private dossierService : DossierService){}

 ngOnInit(): void {
    this.chargerDossiers();
  }

   chargerDossiers(): void {
    this.dossierService.getDossiers().subscribe({
      next:  data => { this.dossiers = data; this.chargement = false; },
      error: err  => { console.error('Erreur récupération dossiers', err); this.chargement = false; }
    });
  }

 
  // Recherche sur IP, bénéficiaire, CIN, référence interne
  dossiersFiltres(): Dossier[] {
    if (!this.recherche.trim()) return this.dossiers;
    const t = this.recherche.toLowerCase();
    return this.dossiers.filter(d =>
      d.ip?.toLowerCase().includes(t)               ||
      d.beneficiaire?.toLowerCase().includes(t)     ||
      d.cin?.toLowerCase().includes(t)              ||
      d.referenceInterne?.toLowerCase().includes(t)
    );
  }

  /* Ancienne version
  dossiersFiltres(): Dossier[] {
    if (!this.recherche.trim()) return this.dossiers;
    const terme = this.recherche.toLowerCase();
    return this.dossiers.filter(d =>
      d.ip?.toLowerCase().includes(terme) ||
      d.beneficiaire?.toLowerCase().includes(terme)
    );
  }*/

}
