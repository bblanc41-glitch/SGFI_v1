import { Component,OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DossierService } from '../../services/dossier.service';
import { Dossier } from '../../models/dossier';
import { FormsModule } from '@angular/forms'; // ← CORRECTION : nécessaire pour [(ngModel)] de la barre de recherche

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
  
  constructor(private dossierService : DossierService){}

  ngOnInit(): void {
    this.chargerDossier();
  }

  chargerDossier(){
    this.dossierService.getDossiers().subscribe({
      next: data => this.dossiers = data,
      error: err => console.error("erreur de recuperation ",err)
    });
  }

  /*
   Filtre les dossiers selon la saisie dans la barre de recherche.
    Recherche sur : IP patient et nom du bénéficiaire. IMPLEMENTATION AVENIR (TEL & CIN)
   */
  dossiersFiltres(): Dossier[] {
    if (!this.recherche.trim()) return this.dossiers;
    const terme = this.recherche.toLowerCase();
    return this.dossiers.filter(d =>
      d.ip?.toLowerCase().includes(terme) ||
      d.beneficiaire?.toLowerCase().includes(terme)
    );
  }

}
