import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DossierService } from '../../services/dossier.service';
import { Notification } from '../../models/dossier';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.css']
})
export class Notifications implements OnInit {
  notifications: Notification[] = [];
  notificationsFiltrees: Notification[] = [];
  chargement = true;

  // Filtres
  filtreType: string = '';
  filtreStatut: string = '';
  recherche: string = '';

  // Pagination
  pageActuelle: number = 1;
  elementsParPage: number = 10;
  totalPages: number = 1;

  // Options
  typesNotification: string[] = [
    'TOUS',
    'DOUBLON_IMPORT',
    'STATUT_CHANGE',
    'ALERTE_ECHEANCE',
    'ALERTE_EXPIRE',
    'ALERTE_SANS_DATE'
  ];

  statutsOptions: string[] = ['TOUS', 'LU', 'NON_LU'];

  constructor(
    private dossierService: DossierService, 
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.chargerNotifications();
  }

  chargerNotifications(): void {
    this.dossierService.getNotifications().subscribe({
      next: (data) => {
        this.notifications = data;
        this.appliquerFiltres();
        this.chargement = false;
        this.cdr.detectChanges();
        console.log('Notifications reçues :', data);
      },
      error: (err) => {
        console.error(err);
        this.chargement = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ==================== FILTRES ====================
  appliquerFiltres(): void {
    let resultats = [...this.notifications];

    // Filtre par type
    if (this.filtreType && this.filtreType !== 'TOUS') {
      resultats = resultats.filter(n => n.type === this.filtreType);
    }

    // Filtre par statut (lu/non lu)
    if (this.filtreStatut && this.filtreStatut !== 'TOUS') {
      if (this.filtreStatut === 'LU') {
        resultats = resultats.filter(n => n.lu === true);
      } else if (this.filtreStatut === 'NON_LU') {
        resultats = resultats.filter(n => n.lu === false);
      }
    }

    // Filtre par recherche (message ou type)
    if (this.recherche.trim()) {
      const terme = this.recherche.toLowerCase();
      resultats = resultats.filter(n => 
        n.message.toLowerCase().includes(terme) ||
        n.type.toLowerCase().includes(terme)
      );
    }

    // Réinitialiser la page courante
    this.pageActuelle = 1;
    this.notificationsFiltrees = resultats;
    this.calculerPagination();
  }

  resetFiltres(): void {
    this.filtreType = '';
    this.filtreStatut = '';
    this.recherche = '';
    this.appliquerFiltres();
  }

  // ==================== PAGINATION ====================
  calculerPagination(): void {
    this.totalPages = Math.ceil(this.notificationsFiltrees.length / this.elementsParPage);
    if (this.totalPages === 0) this.totalPages = 1;
    if (this.pageActuelle > this.totalPages) {
      this.pageActuelle = this.totalPages;
    }
  }

  getNotificationsPage(): Notification[] {
    const debut = (this.pageActuelle - 1) * this.elementsParPage;
    const fin = debut + this.elementsParPage;
    return this.notificationsFiltrees.slice(debut, fin);
  }

  getDebutAffichage(): number {
    return (this.pageActuelle - 1) * this.elementsParPage + 1;
  }

  getFinAffichage(): number {
    return Math.min(this.pageActuelle * this.elementsParPage, this.notificationsFiltrees.length);
  }

  pageSuivante(): void {
    if (this.pageActuelle < this.totalPages) {
      this.pageActuelle++;
      this.cdr.detectChanges();
    }
  }

  pagePrecedente(): void {
    if (this.pageActuelle > 1) {
      this.pageActuelle--;
      this.cdr.detectChanges();
    }
  }

  allerPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.pageActuelle = page;
      this.cdr.detectChanges();
    }
  }

  changerElementsParPage(): void {
    this.pageActuelle = 1;
    this.calculerPagination();
    this.cdr.detectChanges();
  }

  // Générer le tableau des pages à afficher
  getPagesArray(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    let debut = Math.max(1, this.pageActuelle - Math.floor(maxPages / 2));
    let fin = Math.min(this.totalPages, debut + maxPages - 1);
    
    if (fin - debut + 1 < maxPages) {
      debut = Math.max(1, fin - maxPages + 1);
    }
    
    for (let i = debut; i <= fin; i++) {
      pages.push(i);
    }
    return pages;
  }

  // ==================== ACTIONS ====================
  marquerLue(id: number): void {
    this.dossierService.marquerCommeLue(id).subscribe({
      next: () => {
        const notif = this.notifications.find(n => n.id === id);
        if (notif) notif.lu = true;
        this.appliquerFiltres();
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  marquerToutLue(): void {
    if (confirm('Marquer toutes les notifications comme lues ?')) {
      const nonLues = this.notifications.filter(n => !n.lu);
      nonLues.forEach(notif => {
        this.dossierService.marquerCommeLue(notif.id).subscribe({
          next: () => {
            notif.lu = true;
            this.appliquerFiltres();
            this.cdr.detectChanges();
          },
          error: (err) => console.error(err)
        });
      });
    }
  }

  supprimer(id: number): void {
    if (confirm('Supprimer cette notification ?')) {
      this.dossierService.supprimerNotification(id).subscribe({
        next: () => {
          this.notifications = this.notifications.filter(n => n.id !== id);
          this.appliquerFiltres();
          this.cdr.detectChanges();
        },
        error: (err) => console.error(err)
      });
    }
  }

  supprimerTout(): void {
    if (confirm('Supprimer TOUTES les notifications ? Cette action est irréversible.')) {
      const ids = this.notifications.map(n => n.id);
      ids.forEach(id => {
        this.dossierService.supprimerNotification(id).subscribe({
          error: (err) => console.error(err)
        });
      });
      this.notifications = [];
      this.appliquerFiltres();
      this.cdr.detectChanges();
    }
  }

  // ==================== MÉTHODES D'AFFICHAGE ====================
  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'DOUBLON_IMPORT': 'bi bi-exclamation-triangle-fill',
      'STATUT_CHANGE': 'bi bi-arrow-repeat',
      'ALERTE_ECHEANCE': 'bi bi-bell-fill',
      'ALERTE_EXPIRE': 'bi bi-clock-history',
      'ALERTE_SANS_DATE': 'bi bi-calendar-x'
    };
    return icons[type] || 'bi bi-info-circle';
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'DOUBLON_IMPORT': '⚠️ Doublon',
      'STATUT_CHANGE': '🔄 Statut modifié',
      'ALERTE_ECHEANCE': '🔔 Échéance proche',
      'ALERTE_EXPIRE': '⏰ Délai dépassé',
      'ALERTE_SANS_DATE': '📅 Date manquante'
    };
    return labels[type] || type;
  }

  getTypeClass(type: string): string {
    const classes: Record<string, string> = {
      'DOUBLON_IMPORT': 'badge-warning',
      'STATUT_CHANGE': 'badge-info',
      'ALERTE_ECHEANCE': 'badge-warning',
      'ALERTE_EXPIRE': 'badge-danger',
      'ALERTE_SANS_DATE': 'badge-danger'
    };
    return classes[type] || 'badge-secondary';
  }

  getTypeFiltreLabel(type: string): string {
    const labels: Record<string, string> = {
      'TOUS': 'Tous',
      'DOUBLON_IMPORT': 'Doublons',
      'STATUT_CHANGE': 'Changements de statut',
      'ALERTE_ECHEANCE': 'Échéances proches',
      'ALERTE_EXPIRE': 'Délais dépassés',
      'ALERTE_SANS_DATE': 'Dates d\'audience manquantes'
    };
    return labels[type] || type;
  }
}