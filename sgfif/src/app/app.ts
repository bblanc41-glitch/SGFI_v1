import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { DossierService } from './services/dossier.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, RouterLink],//, RouterLinkActive
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {

  username = '';
  userInitials = '';
  userRole = '';
  activeMenu = 'dashboard';
  alertesCount = 0;
  notifCount = 0;

  constructor(
    private router: Router,
    private authService: AuthService,
    private dossierService: DossierService
  ) {}

  ngOnInit(): void {
    // Met à jour les infos utilisateur et les compteurs à chaque changement de route
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.chargerInfosUtilisateur();
        this.chargerCompteurs();
      });

    this.chargerInfosUtilisateur();
    this.chargerCompteurs();
  }

  chargerInfosUtilisateur(): void { 
    const decoded = this.authService.getDecodedToken();
    if (decoded) {
      this.username = decoded.sub || 'Utilisateur';
      this.userRole = decoded.role || '';
      this.userInitials = this.username
        .split(' ').map((m: string) => m[0] ?? '').join('')
        .toUpperCase().slice(0, 2) || this.username.slice(0, 2).toUpperCase();
    }
  }

  chargerCompteurs(): void {
    // Charger le nombre de notifications non lues
    this.dossierService.getNombreNonLues().subscribe({
      next: (count) => {
        this.notifCount = count;
      },
      error: () => {
        this.notifCount = 0;
      }
    });

    // Pour les alertes, à implémenter selon votre logique
    // this.dossierService.getNombreAlertes().subscribe({
    //   next: (count) => { this.alertesCount = count; },
    //   error: () => { this.alertesCount = 0; }
    // });
  }

  estConnecte(): boolean {
    return this.router.url !== '/login' && !!this.authService.getToken();
  }

  setMenu(menu: string): void {
    this.activeMenu = menu;
  }

  deconnexion(): void {
    this.authService.logout();
    this.username = '';
    this.userInitials = '';
    this.userRole = '';
    this.notifCount = 0;
    this.alertesCount = 0;
    this.router.navigate(['/login']);
  }
}


/*
import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';

// ──────────────────────────────────────────────────────────────────────────────
// APP.TS — Composant racine de l'application SGFI
//
// Responsabilités :
//   1. Afficher/masquer la navbar globale selon l'état de connexion
//   2. Exposer le username de l'utilisateur connecté pour la navbar
//   3. Gérer la déconnexion globale
// ──────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, RouterLink, RouterLinkActive],
  // ↑ RouterLink et RouterLinkActive sont nécessaires pour la navbar dans app.html
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {

  username = '';//username Chargé depuis le token JWT via authService.getDecodedToken()

  constructor(
    private router:      Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Met à jour le username à chaque changement de route (utile si l'utilisateur se reconnecte sans recharger la page)
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.chargerUsername();
      });

    this.chargerUsername();
  }

  // ------------------ NOM DE L'UTILISATEUR -----------------------------------------------------
  chargerUsername(): void { 
    const decoded = this.authService.getDecodedToken();
      this.username = decoded?.sub || '';
      //=> "sub" = subject du JWT = username stocké dans generateToken()
  }

  // ----------------- ÉTAT DE CONNEXION -----------------------------------------------------
  estConnecte(): boolean {
    return this.router.url !== '/login' && !!this.authService.getToken();
    // ↑ Double vérification :
    //   1. On n'est pas sur /login
    //   2. Un token valide est présent dans localStorage
    //   → navbar masquée uniquement sur /login ET si pas de token
  }

  // ── DÉCONNEXION ──────────────────────────────────────────────────────────────
  deconnexion(): void {
    this.authService.logout();
    // ↑ Supprime 'token' du localStorage
    this.username = '';
    // ↑ Efface le nom dans la navbar immédiatement
    this.router.navigate(['/login']);
    // ↑ Redirige vers la page de connexion
  }
}
*/