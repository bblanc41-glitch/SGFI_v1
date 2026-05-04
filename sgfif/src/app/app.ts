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

/*import { Component, signal } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';// pour le module *ngIf (test si connexion ou non dans app.html)

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  constructor(private router: Router) {}
 // protected readonly title = signal('sgfif');
 // Cette méthode renvoie vrai si l'utilisateur n'est PAS sur la page de login
  estConnecte(): boolean {
    return this.router.url !== '/login';
  }

  deconnexion() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}*/
