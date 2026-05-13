import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DossierService }    from '../../services/dossier.service';
import { AuthService }       from '../../services/auth.service';
import { Stats, DossierRecent, Notification, getBadgeClass, getLibelle } from '../../models/dossier';

@Component({
  selector:    'app-dashboard',
  standalone:  true,
  imports:     [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrls:   ['./dashboard.css'],
})
export class Dashboard implements OnInit {

  chargement = true;
  erreur = false;

  username = '';
  userInitials = '';
  userRole = '';

  stats: Stats = {
    total: 0, enAttente: 0, envoyeAvocat: 0,
    enInstance: 0, cloture: 0, incomplet: 0, montantImpaye: 0,
  };

  notifications: Notification[] = [];
  recentDossiers: DossierRecent[] = [];
  notifCount = 0; 
  activeMenu = 'dashboard';

  getLibelle    = getLibelle;
  getBadgeClass = getBadgeClass;

  // Compteur pour savoir quand tous les appels sont terminés
  private appelsEnCours = 0;
  

  constructor(
    private dossierService: DossierService,
    private authService:    AuthService,
    private router:         Router,
    private cdr:            ChangeDetectorRef   // ← 1. Injection
  ) {}

  ngOnInit(): void {
    this.chargerUtilisateur();
    this.chargerStats();
    this.chargerDossiersRecents();
    this.chargerNotifCount();
   }

  private verifierFinChargement(): void {
    this.appelsEnCours--;
    if (this.appelsEnCours === 0) {
      this.chargement = false;
      this.cdr.detectChanges();   // ← 1. Force l'affichage final
    }
  }

  chargerUtilisateur(): void {
    const decoded = this.authService.getDecodedToken();
    if (!decoded) { this.router.navigate(['/login']); return; }
    this.username  = decoded.sub || 'Utilisateur';
    this.userRole  = decoded.role || '';
    this.userInitials = this.username
      .split(' ').map(m => m[0] ?? '').join('')
      .toUpperCase().slice(0, 2) || this.username.slice(0, 2).toUpperCase();
    this.cdr.detectChanges();
  }

  chargerStats(): void {
    this.appelsEnCours++;
    this.dossierService.getStats().subscribe({
      next: s => {
        this.stats = s;
        this.cdr.detectChanges();   // ← 1. Mise à jour immédiate des cartes
        this.verifierFinChargement();
      },
      error: err => {
        console.error('Erreur chargement stats', err);
        this.erreur = true;
        this.verifierFinChargement();
      }
    });
  }

  chargerDossiersRecents(): void {
    this.appelsEnCours++;
    this.dossierService.getRecent(5).subscribe({
      next: data => {
        this.recentDossiers = data;
        this.cdr.detectChanges();   // ← 1. Met à jour le tableau des récents
        this.verifierFinChargement();
      },
      error: err => {
        console.error('Erreur chargement dossiers récents', err);
        this.verifierFinChargement();
      }
    });
  }

   chargerNotifCount(): void {
    this.dossierService.getNombreNonLues().subscribe({
      next: (count) => {
        this.notifCount = count;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notifCount = 0;
      }
    });
  }

  voirDossier(id: number | undefined): void {
    if (id) this.router.navigate(['/dossier-detail', id]);
  }
  
  // Optionnel : à réactiver quand l'endpoint backend sera créé
  /*
  chargerNotifications(): void {
    this.appelsEnCours++;
    this.dossierService.getNotifications().subscribe({
      next: notifs => {
        this.notifications = notifs;
        this.cdr.detectChanges();
        this.verifierFinChargement();
      },
      error: err => {
        console.error('Erreur chargement notifications', err);
        this.verifierFinChargement();
      }
    });
  }
  */



  get cartes() {
    return [
      { label: 'Total dossiers',       valeur: this.stats.total,         icone: 'bi-folder2-open',         couleur: 'primary',   lien: '/liste-dossiers', montant: false },
      { label: 'En attente',           valeur: this.stats.enAttente,     icone: 'bi-hourglass-split',      couleur: 'warning',   lien: '/liste-dossiers', montant: false },
      { label: 'Envoyés à l\'avocat',  valeur: this.stats.envoyeAvocat,  icone: 'bi-send',                 couleur: 'info',      lien: '/liste-dossiers', montant: false },
      { label: 'En instance',          valeur: this.stats.enInstance,    icone: 'bi-bank',                 couleur: 'secondary', lien: '/liste-dossiers', montant: false },
      { label: 'Incomplets',           valeur: this.stats.incomplet,     icone: 'bi-exclamation-triangle', couleur: 'danger',    lien: '/liste-dossiers', montant: false },
      { label: 'Clôturés',             valeur: this.stats.cloture,       icone: 'bi-check-circle',         couleur: 'success',   lien: '/liste-dossiers', montant: false },
      { label: 'Montant impayé (MAD)', valeur: this.stats.montantImpaye, icone: 'bi-cash-stack',           couleur: 'orange',    lien: null,              montant: true  },
    ];
  }

  getStatutClass(statut?: string): string {
    return getBadgeClass(statut);
  }

  setMenu(menu: string): void {
    this.activeMenu = menu;
   // this.cdr.detectChanges();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}