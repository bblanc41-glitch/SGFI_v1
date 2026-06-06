import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DossierService } from '../../services/dossier.service';
import { Dossier, getBadgeClass, getLibelle } from '../../models/dossier';
import { SuiviJuridique } from '../../models/suivi-juridique';
import { Router } from '@angular/router';

@Component({
  selector: 'app-liste-dossiers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './liste-dossiers.html',
  styleUrl: './liste-dossiers.css',
})
export class ListeDossiers implements OnInit {
  dossiers: Dossier[] = [];
  dossiersFiltres: Dossier[] = [];
  chargement: boolean = true;
  
  // Cache des suivis par dossier pour éviter les appels multiples
  suivisCache: Map<string, SuiviJuridique[]> = new Map();

  getBadgeClass = getBadgeClass;
  getLibelle = getLibelle;

  // ==================== PROPRIÉTÉS DE FILTRAGE ====================
  filtreStatut: string = '';
  filtreDelai: string = '';
  recherche: string = '';

  constructor(
    private dossierService: DossierService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.chargerDossiers();
  }

  chargerDossiers(): void {
    this.dossierService.getDossiers().subscribe({
      next: (data) => {
        this.dossiers = data;
        this.dossiersFiltres = [...this.dossiers];
        this.chargerTousLesSuivis();
        this.chargement = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur récupération dossiers', err);
        this.chargement = false;
      }
    });
  }

  // ==================== CHARGEMENT DES SUIVIS ====================
  chargerTousLesSuivis(): void {
    this.dossiers.forEach(dossier => {
      if (dossier.referenceInterne) {
        this.dossierService.getSuivis(dossier.referenceInterne).subscribe({
          next: (suivis) => {
            this.suivisCache.set(dossier.referenceInterne!, suivis);
            this.cdr.detectChanges();
          },
          error: (err) => console.error(`Erreur chargement suivis pour ${dossier.referenceInterne}`, err)
        });
      }
    });
  }

  getSuivisDuDossier(dossier: Dossier): SuiviJuridique[] {
    return this.suivisCache.get(dossier.referenceInterne!) || [];
  }

  // ==================== CALCUL DU DÉLAI GLOBAL ====================
  calculerDelaiGlobal(dossier: Dossier): { jours: number | null; niveau: string; label: string; class: string } {
    const suivis = this.getSuivisDuDossier(dossier);
    
    if (suivis.length === 0) {
      return { jours: null, niveau: 'aucun', label: 'Aucun suivi', class: 'text-muted' };
    }

    let joursMin: number | null = null;
    let aDesSuivisTraites = true;
    let aDesSuivisUrgents = false;
    let aDesSuivisProches = false;

    for (const suivi of suivis) {
      const delai = this.calculerDelai(suivi);
      
      if (delai !== null && delai !== -1) {
        aDesSuivisTraites = false;
        if (delai <= 7) aDesSuivisUrgents = true;
        if (delai > 7 && delai <= 15) aDesSuivisProches = true;
        
        if (joursMin === null || delai < joursMin) {
          joursMin = delai;
        }
      }
    }

    // Cas 1 : Tous les suivis sont traités
    if (aDesSuivisTraites && suivis.length > 0) {
      return { jours: -1, niveau: 'termine', label: '✓ Terminé', class: 'text-success' };
    }

    // Cas 2 : Au moins un suivi urgent
    if (aDesSuivisUrgents) {
      return { jours: joursMin, niveau: 'urgent', label: `⚠️ Urgent (${joursMin} j)`, class: 'text-danger fw-bold' };
    }

    // Cas 3 : Au moins un suivi proche
    if (aDesSuivisProches) {
      return { jours: joursMin, niveau: 'proche', label: `⏰ Bientôt (${joursMin} j)`, class: 'text-warning' };
    }

    // Cas 4 : Délai normal
    if (joursMin !== null && joursMin > 15) {
      return { jours: joursMin, niveau: 'normal', label: `${joursMin} jours`, class: 'text-info' };
    }

    return { jours: null, niveau: 'aucun', label: '—', class: 'text-muted' };
  }

  calculerDelai(suivi: SuiviJuridique): number | null {
    if (!suivi) return null;
    
    // Cas traité
    if (suivi.jugement && suivi.jugement.trim() !== '' && suivi.dateAudience) {
      return -1;
    }
    
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    
    // Cas avec date d'audience
    if (suivi.dateAudience) {
      const dateAudience = new Date(suivi.dateAudience);
      dateAudience.setHours(0, 0, 0, 0);
      const diffTime = dateAudience.getTime() - aujourdhui.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    // Cas sans date d'audience
    if (suivi.dateCreation) {
      const dateCreation = new Date(suivi.dateCreation);
      dateCreation.setHours(0, 0, 0, 0);
      const dateLimite = new Date(dateCreation);
      dateLimite.setDate(dateLimite.getDate() + 30);
      const diffTime = dateLimite.getTime() - aujourdhui.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    return null;
  }

  // ==================== MÉTHODES DE FILTRAGE ====================
  appliquerFiltres(): void {
    this.dossiersFiltres = [...this.dossiers];

    // Filtre par statut
    if (this.filtreStatut) {
      if (this.filtreStatut === 'URGENT') {
        this.dossiersFiltres = this.dossiersFiltres.filter(d => 
          this.calculerDelaiGlobal(d).niveau === 'urgent'
        );
      } else if (this.filtreStatut === 'PROCHE') {
        this.dossiersFiltres = this.dossiersFiltres.filter(d => 
          this.calculerDelaiGlobal(d).niveau === 'proche'
        );
      } else {
        this.dossiersFiltres = this.dossiersFiltres.filter(d => d.statut === this.filtreStatut);
      }
    }

    // Filtre par délai (basé sur le délai global)
    if (this.filtreDelai) {
      const jours = parseInt(this.filtreDelai);
      this.dossiersFiltres = this.dossiersFiltres.filter(d => {
        const delai = this.calculerDelaiGlobal(d);
        if (this.filtreDelai === 'EXPIRED') {
          return delai.jours !== null && delai.jours < 0;
        }
        return delai.jours !== null && delai.jours <= jours && delai.jours >= 0;
      });
    }

    // Filtre par recherche
    if (this.recherche.trim()) {
      const terme = this.recherche.toLowerCase();
      this.dossiersFiltres = this.dossiersFiltres.filter(d =>
        d.ip?.toLowerCase().includes(terme) ||
        d.beneficiaire?.toLowerCase().includes(terme) ||
        d.cin?.toLowerCase().includes(terme) ||
        d.referenceInterne?.toLowerCase().includes(terme) ||
        d.numeroFacture?.toLowerCase().includes(terme) ||
        d.statut?.toLowerCase().includes(terme)
      );
    }

    this.cdr.detectChanges();
  }

  resetFiltres(): void {
    this.filtreStatut = '';
    this.filtreDelai = '';
    this.recherche = '';
    this.dossiersFiltres = [...this.dossiers];
    this.cdr.detectChanges();
  }

  // ==================== ACTIONS ====================
  voirDossier(id: number | undefined): void {
    if (id) this.router.navigate(['/dossier-detail', id]);
  }

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
}


/*import { Component, OnInit } from '@angular/core';
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
/*
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

/*
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

//}