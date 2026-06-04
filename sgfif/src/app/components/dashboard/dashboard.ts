import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DossierService } from '../../services/dossier.service';
import { AuthService } from '../../services/auth.service';
import { Stats, DossierRecent, Notification, getBadgeClass, getLibelle, Dossier } from '../../models/dossier';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
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
  alertesCount = 0;
  activeMenu = 'dashboard';

  // ==================== PROPRIÉTÉS DE FILTRAGE ====================
  filtreStatut: string = '';
  filtreDelai: string = '';
  recherche: string = '';
  dossiersFiltres: DossierRecent[] = [];
  tousDossiers: DossierRecent[] = [];

  // Alertes récapitulatives
  alertesRecap: any[] = [];

  getLibelle = getLibelle;
  getBadgeClass = getBadgeClass;

  private appelsEnCours = 0;

  constructor(
    private dossierService: DossierService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.chargerUtilisateur();
    this.chargerStats();
    this.chargerDossiersRecents();
    this.chargerNotifCount();
    this.chargerTousDossiers();
  }

  private verifierFinChargement(): void {
    this.appelsEnCours--;
    if (this.appelsEnCours === 0) {
      this.chargement = false;
      this.cdr.detectChanges();
    }
  }

  chargerUtilisateur(): void {
    const decoded = this.authService.getDecodedToken();
    if (!decoded) { this.router.navigate(['/login']); return; }
    this.username = decoded.sub || 'Utilisateur';
    this.userRole = decoded.role || '';
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
        this.cdr.detectChanges();
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
        this.cdr.detectChanges();
        this.verifierFinChargement();
      },
      error: err => {
        console.error('Erreur chargement dossiers récents', err);
        this.verifierFinChargement();
      }
    });
  }

  chargerTousDossiers(): void {
    this.dossierService.getDossiers().subscribe({
      next: (data: any[]) => {
        this.tousDossiers = data;
        this.dossiersFiltres = [...this.tousDossiers];
        this.genererAlertesRecap();
        this.cdr.detectChanges();
      },
      error: err => console.error('Erreur chargement dossiers', err)
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

  // ==================== MÉTHODES DE FILTRAGE ====================
  appliquerFiltres(): void {
    this.dossiersFiltres = [...this.tousDossiers];

    // Filtre par statut
    if (this.filtreStatut) {
      if (this.filtreStatut === 'URGENT') {
        this.dossiersFiltres = this.dossiersFiltres.filter(d => this.estUrgent(d));
      } else {
        this.dossiersFiltres = this.dossiersFiltres.filter(d => d.statut === this.filtreStatut);
      }
    }

    // Filtre par délai
    if (this.filtreDelai) {
      this.dossiersFiltres = this.dossiersFiltres.filter(d => this.filtrerParDelai(d));
    }

    // Filtre par recherche
    if (this.recherche.trim()) {
      const terme = this.recherche.toLowerCase();
      this.dossiersFiltres = this.dossiersFiltres.filter(d =>
        d.ip?.toLowerCase().includes(terme) ||
        d.beneficiaire?.toLowerCase().includes(terme) ||
        d.referenceInterne?.toLowerCase().includes(terme) ||
        d.numeroFacture?.toLowerCase().includes(terme)
      );
    }

    this.cdr.detectChanges();
  }

  resetFiltres(): void {
    this.filtreStatut = '';
    this.filtreDelai = '';
    this.recherche = '';
    this.dossiersFiltres = [...this.tousDossiers];
    this.cdr.detectChanges();
  }

  getLibelleFiltre(): string {
    const statuts: Record<string, string> = {
      'URGENT': 'Urgents',
      'INCOMPLET': 'Incomplets',
      'EN_INSTANCE': 'En instance',
      'EN_APPEL': 'En appel',
      'EN_CASSATION': 'En cassation',
      'ENVOYE_AVOCAT': 'Envoyés à l\'avocat',
      'VALIDE_POUR_TRANSMISSION': 'Validés pour transmission',
      'CLOTURE': 'Clôturés'
    };
    return statuts[this.filtreStatut] || this.filtreStatut;
  }

  // ==================== MÉTHODES D'URGENCE ====================
  // la méthode estUrgent par :
  estUrgent(dossier: any): boolean {
    // Vérifier d'abord si dateLimiteAction existe
    if (dossier.dateLimiteAction) {
      const joursRestants = this.calculerJoursRestants(dossier.dateLimiteAction);
      if (joursRestants <= 7 && joursRestants >= 0) return true;
    }
    
    // Vérifier les dossiers incomplets sans dateLimiteAction
    if (dossier.statut === 'INCOMPLET' && dossier.dateMiseAJour) {
      const joursInactif = this.calculerJoursDepuis(dossier.dateMiseAJour);
      if (joursInactif > 15) return true;
    }
    
    return false;
  }

  // méthode estProche par :
  estProche(dossier: any): boolean {
    if (dossier.dateLimiteAction) {
      const joursRestants = this.calculerJoursRestants(dossier.dateLimiteAction);
      return joursRestants <= 15 && joursRestants > 7;
    }
    return false;
  }

  // méthode filtrerParDelai par :
  filtrerParDelai(dossier: any): boolean {
    if (!dossier.dateLimiteAction) return false;
    const joursRestants = this.calculerJoursRestants(dossier.dateLimiteAction);
    const delai = parseInt(this.filtreDelai);
    if (this.filtreDelai === 'EXPIRED') {
      return joursRestants < 0;
    }
    return joursRestants <= delai && joursRestants >= 0;
  }
  /* estUrgent(dossier: any): boolean {
    if (dossier.dateLimiteAction) {
      const joursRestants = this.calculerJoursRestants(dossier.dateLimiteAction);
      if (joursRestants <= 7 && joursRestants >= 0) return true;
    }
    if (dossier.statut === 'INCOMPLET' && dossier.dateMiseAJour) {
      const joursInactif = this.calculerJoursDepuis(dossier.dateMiseAJour);
      if (joursInactif > 15) return true;
    }
    return false;
  }

  estProche(dossier: any): boolean {
    if (dossier.dateLimiteAction) {
      const joursRestants = this.calculerJoursRestants(dossier.dateLimiteAction);
      return joursRestants <= 15 && joursRestants > 7;
    }
    return false;
  }

  filtrerParDelai(dossier: any): boolean {
    if (!dossier.dateLimiteAction) return false;
    const joursRestants = this.calculerJoursRestants(dossier.dateLimiteAction);
    const delai = parseInt(this.filtreDelai);
    if (this.filtreDelai === 'EXPIRED') {
      return joursRestants < 0;
    }
    return joursRestants <= delai && joursRestants >= 0;
  }*/

  calculerJoursRestants(dateLimite: string): number {
    const aujourdhui = new Date();
    const dateFin = new Date(dateLimite);
    const diffTime = dateFin.getTime() - aujourdhui.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  calculerJoursDepuis(date: string): number {
    const aujourdhui = new Date();
    const dateDebut = new Date(date);
    const diffTime = aujourdhui.getTime() - dateDebut.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // ==================== ALERTES RÉCAPITULATIVES ====================
  genererAlertesRecap(): void {
  this.alertesRecap = [];
  let alerteCount = 0;

  // Alertes délai imminent (uniquement si dateLimiteAction existe)
  const dossiersAvecDateLimite = this.tousDossiers.filter(d => d.dateLimiteAction);
  const dossiersUrgents = dossiersAvecDateLimite.filter(d => this.estUrgent(d));
  if (dossiersUrgents.length > 0) {
    this.alertesRecap.push({
      type: 'danger',
      icone: 'bi bi-exclamation-triangle-fill',
      message: `${dossiersUrgents.length} dossier(s) urgent(s) nécessitent une action immédiate !`
    });
    alerteCount += dossiersUrgents.length;
  }

  // Alertes délai proche (uniquement si dateLimiteAction existe)
  const dossiersProches = dossiersAvecDateLimite.filter(d => this.estProche(d));
  if (dossiersProches.length > 0) {
    this.alertesRecap.push({
      type: 'warning',
      icone: 'bi bi-clock-fill',
      message: `${dossiersProches.length} dossier(s) ont un délai d'action dans moins de 15 jours.`
    });
    alerteCount += dossiersProches.length;
  }

  // Alertes dossiers incomplets anciens
  const incompletsAnciens = this.tousDossiers.filter(d => 
    d.statut === 'INCOMPLET' && d.dateMiseAJour && this.calculerJoursDepuis(d.dateMiseAJour) > 30
  );
  if (incompletsAnciens.length > 0) {
    this.alertesRecap.push({
      type: 'warning',
      icone: 'bi bi-folder-symlink-fill',
      message: `${incompletsAnciens.length} dossier(s) incomplet(s) depuis plus de 30 jours.`
    });
    alerteCount += incompletsAnciens.length;
  }

  this.alertesCount = alerteCount;
}
  /*genererAlertesRecap(): void {
    this.alertesRecap = [];
    let alerteCount = 0;

    // Alertes délai imminent
    const dossiersUrgents = this.tousDossiers.filter(d => this.estUrgent(d));
    if (dossiersUrgents.length > 0) {
      this.alertesRecap.push({
        type: 'danger',
        icone: 'bi bi-exclamation-triangle-fill',
        message: `${dossiersUrgents.length} dossier(s) urgent(s) nécessitent une action immédiate !`
      });
      alerteCount += dossiersUrgents.length;
    }

    // Alertes délai proche
    const dossiersProches = this.tousDossiers.filter(d => this.estProche(d));
    if (dossiersProches.length > 0) {
      this.alertesRecap.push({
        type: 'warning',
        icone: 'bi bi-clock-fill',
        message: `${dossiersProches.length} dossier(s) ont un délai d'action dans moins de 15 jours.`
      });
      alerteCount += dossiersProches.length;
    }

    // Alertes dossiers incomplets anciens
    const incompletsAnciens = this.tousDossiers.filter(d => 
      d.statut === 'INCOMPLET' && d.dateMiseAJour && this.calculerJoursDepuis(d.dateMiseAJour) > 30
    );
    if (incompletsAnciens.length > 0) {
      this.alertesRecap.push({
        type: 'warning',
        icone: 'bi bi-folder-symlink-fill',
        message: `${incompletsAnciens.length} dossier(s) incomplet(s) depuis plus de 30 jours.`
      });
      alerteCount += incompletsAnciens.length;
    }

    this.alertesCount = alerteCount;
  }*/

  voirDossier(id: number | undefined): void {
    if (id) this.router.navigate(['/dossier-detail', id]);
  }

  get cartes() {
    return [
      { label: 'Total dossiers', valeur: this.stats.total, icone: 'bi-folder2-open', couleur: 'primary', lien: '/liste-dossiers', montant: false },
      { label: 'En attente', valeur: this.stats.enAttente, icone: 'bi-hourglass-split', couleur: 'warning', lien: '/liste-dossiers', montant: false },
      { label: 'Envoyés à l\'avocat', valeur: this.stats.envoyeAvocat, icone: 'bi-send', couleur: 'info', lien: '/liste-dossiers', montant: false },
      { label: 'En instance', valeur: this.stats.enInstance, icone: 'bi-bank', couleur: 'secondary', lien: '/liste-dossiers', montant: false },
      { label: 'Incomplets', valeur: this.stats.incomplet, icone: 'bi-exclamation-triangle', couleur: 'danger', lien: '/liste-dossiers', montant: false },
      { label: 'Clôturés', valeur: this.stats.cloture, icone: 'bi-check-circle', couleur: 'success', lien: '/liste-dossiers', montant: false },
      { label: 'Montant impayé (MAD)', valeur: this.stats.montantImpaye, icone: 'bi-cash-stack', couleur: 'orange', lien: null, montant: true },
    ];
  }

  getStatutClass(statut?: string): string {
    return getBadgeClass(statut);
  }

  setMenu(menu: string): void {
    this.activeMenu = menu;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

/*import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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


/*
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
}*/