import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DossierService }    from '../../services/dossier.service';
import { AuthService }       from '../../services/auth.service';
import { Stats, DossierRecent, Notification, getBadgeClass, getLibelle } from '../../models/dossier';
 

// DASHBOARD — Tableau de bord du Service Juridique SGFI
//navbar intégrée, sidebar, dossiers récents, username dynamique
// cartes stats complètes via getter, spinner de chargement

@Component({
  selector:    'app-dashboard',
  standalone:  true,
  imports:     [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl:    './dashboard.css',
})
export class Dashboard implements OnInit {

  // ------------ ÉTAT DE CHARGEMENT -----------------------------------------------------
  chargement = true;//affichage du spinner tant que les données ne sont pas reçues du backend
  erreur = false;//=> true si le backend retourne une erreur — affiche un message dans le template

  // ------------ DONNÉES UTILISATEUR -----------------------------------------------------
  username     = '';//=> user chargé depuis le token JWT
  userInitials = '';// Initiales affichées dans l'avatar circulaire (ex: "BA" pour Billy Admin)
  userRole = '';//=> Rôle de l'utilisateur (ADMIN, JURIDIQUE, CCR) — affiché dans la sidebar

  // ------------ STATISTIQUES -----------------------------------------------------
  // statistique global
  stats: Stats = {
    total: 0, enAttente: 0, envoyeAvocat: 0,
    enInstance: 0, cloture: 0, incomplet: 0, montantImpaye: 0,
  };

  // ------------NOTIFICATIONS -----------------------------------------------------
  notifications: Notification[] = [];
  //notifications: { id: number; message: string; date: string; lue: boolean }[] = [];//Tableau dynamique — chargé depuis le backend (dossiers urgents, échéances…)
  
  get notifCount(): number {
    return this.notifications.filter(n => !n.lue).length;//compte uniquement les notifications non lues
   }

  // ------------ DOSSIERS RÉCENTS -----------------------------------------------------
  recentDossiers: DossierRecent[] = [];
  // ↑ Les 5 derniers dossiers modifiés — chargés depuis le backend

  // ── MENU ACTIF (SIDEBAR) -----------------------------------------------------
  activeMenu = 'dashboard';// => Contrôle la classe CSS "active" sur l'élément de sidebar sélectionné

  // ── RACCOURCIS TEMPLATE -----------------------------------------------------
  // Raccourcis template — utilisent les enums (ENVOYE_AVOCAT, CLOTURE…)
  getLibelle    = getLibelle;
  getBadgeClass = getBadgeClass;
  //Fonctions utilitaires importées depuis le modèle dossier
  //Utilisées dans le template pour afficher les libellés et badges de statut

  constructor(
    private dossierService: DossierService,
    private authService:    AuthService,
    private router:         Router,
  ) {}

  // ── INITIALISATION -----------------------------------------------------
  ngOnInit(): void {
    this.chargerUtilisateur();
    this.chargerStats();
    this.chargerDossiersRecents();
    this.chargerNotifications();
  }

  // ── CHARGEMENT UTILISATEUR
   chargerUtilisateur(): void {
    const decoded = this.authService.getDecodedToken();
    if (!decoded) { this.router.navigate(['/login']); return; }
    this.username  = decoded.sub || 'Utilisateur';
    this.userRole  = decoded.role || '';
    this.userInitials = this.username
      .split(' ').map((m: string) => m[0] ?? '').join('')
      .toUpperCase().slice(0, 2) || this.username.slice(0, 2).toUpperCase();
  } 
  /* Ancienne
  chargerUtilisateur(): void {
    const token = this.authService.getToken();
    if (!token) {// Pas de token => redirection vers login
      this.router.navigate(['/login']);
      return;
    }*/


  // ------------ CHARGEMENT STATISTIQUES  -----------------------------------------------------
  chargerStats(): void {
    this.dossierService.getStats().subscribe({
      next: s => { this.stats = s; this.chargement = false;},//=> Désactive le spinner une fois les stats reçues
      error: () => {this.chargement = false; this.erreur     = true;}//=> Affiche le message d'erreur sans bloquer l'interface  
    });
  }

  // ----------- CHARGEMENT DOSSIERS RÉCENTS -----------------------------------------------------
  chargerDossiersRecents(): void {
    this.dossierService.getRecent(5).subscribe({
      next:  data  => { this.recentDossiers = data; },
      error: ()    => {}// table reste vide — pas bloquant
    });
  }

  
  // -------------- CHARGEMENT NOTIFICATIONS -----------------------------------------------------
  chargerNotifications(): void {
    this.dossierService.getNotifications().subscribe({
      next:  notifs => { this.notifications = notifs; },
      error: ()     => { /* badge reste à 0 — pas bloquant */ }
    });
  }


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

  //CARTES STATISTIQUES (getter) 
  // Fusion version 1 (3 cartes) + version 2 (6 cartes) → 7 cartes complètes
  /*Ancienne version
  
  get cartes() {
    return [
      {label:   'Total dossiers',valeur:  this.stats.total, icone:   'bi-folder2-open',couleur: 'primary', lien:    '/liste-dossiers'},
      {
        label:   'En attente',
        valeur:  this.stats.enAttente,
        icone:   'bi-hourglass-split',
        couleur: 'warning',
        lien:    '/liste-dossiers'
      },
      {
        label:   'Envoyés à l\'avocat',
        valeur:  this.stats.envoyeAvocat,
        icone:   'bi-send',
        couleur: 'info',
        lien:    '/liste-dossiers'
      },
      {
        label:   'En instance',
        valeur:  this.stats.enInstance,
        icone:   'bi-bank',
        couleur: 'secondary',
        lien:    '/liste-dossiers'
      },
      {
        label:   'Incomplets',
        valeur:  this.stats.incomplet,
        icone:   'bi-exclamation-triangle',
        couleur: 'danger',
        lien:    '/liste-dossiers'
      },
      {
        label:   'Clôturés',
        valeur:  this.stats.cloture,
        icone:   'bi-check-circle',
        couleur: 'success',
        lien:    '/liste-dossiers'
      },
      {
        label:   'Montant impayé (MAD)',
        valeur:  this.stats.montantImpaye,
        icone:   'bi-cash-stack',
        couleur: 'orange',
        lien:    null,
        montant: true   // ↑ flag spécial → formatage monétaire dans le template
      },
    ];
  }*/


      // ------------------ CLASSE BADGE STATUT-----------------------------------------------------
   // La nouvelle délègue à getBadgeClass() qui gère les enums (CLOTURE, EN_INSTANCE…)
  getStatutClass(statut?: string): string {
    return getBadgeClass(statut);
  }
  
      /*Ancienne version
      getStatutClass(statut: string): string {
    // Fusion des deux mappings de statuts
    const map: Record<string, string> = {
      'Importé CCR':               'badge-attente',
      'En attente de prise en charge': 'badge-attente',
      'Valider pour transmission': 'badge-envoye',
      'Envoyé à avocat':           'badge-envoye',
      'En instance':               'badge-instance',
      'Appel':                     'badge-appel',
      'Cassation':                 'badge-cassation',
      'Clôturé':                   'badge-cloture',
      'Incomplet':                 'badge-incomplet',
    };
    return map[statut] ?? 'badge-attente';
  }*/

  // ------------------- NAVIGATION SIDEBAR-----------------------------------------------------
  setMenu(menu: string): void { this.activeMenu = menu; }// MAJ de l'élément actif dans la sidebar
 
// --------------------- DÉCONNEXION -----------------------------------------------------
  logout(): void {
    this.authService.logout();// Supprime le token du localStorage
    this.router.navigate(['/login']);//redirection vers la page de connexion
  }

    /*const decoded = this.authService.getDecodedToken();
    if (decoded) {
      this.username  = decoded.sub || 'Utilisateur';
      this.userRole  = decoded.role || '';
      // Génère les initiales : "billy admin" → "BA"
      this.userInitials = this.username
        .split(' ')
        .map((mot: string) => mot[0] ?? '')
        .join('')
        .toUpperCase()
        .slice(0, 2) || this.username.slice(0, 2).toUpperCase();
    }*/
}





  


/*//dashboard
import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { RouterLink }        from '@angular/router';
import { DossierService }    from '../../services/dossier.service';
import { Stats, getLibelle, getBadgeClass } from '../../models/dossier';

@Component({
  selector:    'app-dashboard',
  standalone:  true,
  imports:     [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl:    './dashboard.css',
})
export class Dashboard implements OnInit {

  stats: Stats = { total: 0, enAttente: 0, envoyeAvocat: 0, enInstance: 0, cloture: 0, incomplet: 0 };
  chargement = true;

  // Raccourcis utilisés dans le template
  getLibelle    = getLibelle;
  getBadgeClass = getBadgeClass;

  constructor(private dossierService: DossierService) {}

  ngOnInit(): void {
    this.dossierService.getStats().subscribe({
      next:  stats => { this.stats = stats; this.chargement = false; },
      error: ()    => { this.chargement = false; }
    });
  }

  // Cartes de statistiques affichées dans le dashboard
  get cartes() {
    return [
      { label: 'Total dossiers',      valeur: this.stats.total,        icone: 'bi-folder2-open',    couleur: 'primary' },
      { label: 'En attente',          valeur: this.stats.enAttente,    icone: 'bi-hourglass-split', couleur: 'warning' },
      { label: 'Envoyés à l\'avocat', valeur: this.stats.envoyeAvocat, icone: 'bi-send',            couleur: 'info'    },
      { label: 'En instance',         valeur: this.stats.enInstance,   icone: 'bi-bank',            couleur: 'secondary'},
      { label: 'Dossiers incomplets', valeur: this.stats.incomplet,    icone: 'bi-exclamation-triangle', couleur: 'danger' },
      { label: 'Clôturés',            valeur: this.stats.cloture,      icone: 'bi-check-circle',    couleur: 'success' },
    ];
  }
}*/