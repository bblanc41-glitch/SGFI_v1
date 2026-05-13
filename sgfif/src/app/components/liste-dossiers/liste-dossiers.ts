import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { DossierService }    from '../../services/dossier.service';
import { Dossier, getBadgeClass, getLibelle } from '../../models/dossier';
import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

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
 
  constructor(
              private dossierService : DossierService,
              private router: Router,
              private cdr: ChangeDetectorRef){}

 ngOnInit(): void {
    this.chargerDossiers();
  }

   chargerDossiers(): void {
    this.dossierService.getDossiers().subscribe({
      next:  data => { this.dossiers = data;
                       this.chargement = false;
                       console.log('[ListeDossiers] dossiers reçus :', data);// Pour afficher les log
                       this.cdr.detectChanges();   // ← force la mise à jour de l’affichage
                      },
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
      d.referenceInterne?.toLowerCase().includes(t) ||
      d.statut?.toLocaleLowerCase().includes(t)
    );
  }


  voirDossier(id: number | undefined): void {
    if (id) this.router.navigate(['/dossier-detail', id]);
  }


  /*
  voirDossier(id: number | undefined): void {
    // Pour l’instant, on récupère le dossier depuis le tableau local
    const dossier = this.dossiers.find(d => d.idDossier === id);
    alert(JSON.stringify(dossier, null, 2));
    // Plus tard : this.router.navigate(['/dossiers', id]);
  }*/

  modifierDossier(id: number | undefined): void {
    alert(`Modification du dossier ${id} à implémenter plus tard.`);
    // this.router.navigate(['/dossiers/edit', id]);
  }

/*
cloturerDossier(id: number ): void {
  const motif = prompt('Motif de clôture (obligatoire) :');
  if (!motif || motif.trim() === '') {
    alert('Un motif est requis pour clôturer un dossier.');
    return;
  }

  this.dossierService.changerStatut(id, 'CLOTURE', motif).subscribe({
    next: () => {
      alert('Dossier clôturé avec succès.');
      this.chargerDossiers();  // recharge la liste
    },
    error: (err) => {
      console.error('Erreur lors de la clôture', err);
      alert('Erreur : ' + (err.error?.message || 'Vérifiez les logs.'));
    }
  });
}*/


cloturerDossier(id: number | undefined): void {
  if (!id) return;
  const motif = prompt('Motif de clôture (obligatoire) :');
  if (!motif?.trim()) {
    alert('Motif requis pour clôturer.');
    return;
  }
  this.dossierService.changerStatut(id, 'CLOTURE', motif).subscribe({
    next: () => {
      alert('Dossier clôturé');
      this.chargerDossiers();
    },
    error: (err) => console.error(err)
  });
}




/* utile pour plus tard
supprimerDossier(id: number): void {
  if (confirm('Voulez-vous vraiment supprimer ce dossier ?')) {
    this.dossierService.delete(id).subscribe({
      next: () => {
        // Recharger la liste après suppression
        this.chargerDossiers();
      },
      error: (err) => console.error('Erreur suppression', err)
    });
  }
}*/




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