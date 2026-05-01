import { Component, signal } from '@angular/core';
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
}
