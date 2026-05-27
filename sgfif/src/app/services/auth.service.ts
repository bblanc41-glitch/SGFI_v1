// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {

  //private loginUrl = 'http://localhost:8080/api/auth/login';
  private loginUrl = 'http://127.0.0.1:8080/api/auth/login';//Pour resoudre pb lenteur

  constructor(private http: HttpClient) {}

  //CONNEXION ──
  login(credentials: { username: string; password: string }): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(this.loginUrl, credentials);
  }

  //DÉCONNEXION 
  logout(): void {
    localStorage.removeItem('token');
  }

  //TOKEN BRUT ─
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  //ÉTAT DE CONNEXION ────────────────────────────────────────────────────
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  //DÉCODAGE DU TOKEN JWT ────────────────────────────────────────────────
  // Un JWT = header.payload.signature (3 parties séparées par des points).
  // Le payload est en Base64Url → on le convertit en Base64 standard,
  // puis on décode avec atob() et decodeURIComponent pour le support UTF-8
  // (prénoms avec accents, caractères arabes translittérés, etc.).
  //
  // ⚠️  CORRECTION CRITIQUE par rapport à la version précédente :
  //
  //  1. Le catch NE DOIT PAS appeler logout().
  //     Un échec de décodage côté client ne signifie pas que le token est
  //     révoqué. La validation réelle (signature HMAC, expiration) reste
  //     côté serveur dans JwtAuthFilter.java.
  //     → Avant : si atob() échouait (ex. nom d'utilisateur avec accent),
  //       logout() supprimait le token de localStorage. La requête suivante
  //       partait SANS header Authorization → backend retournait 401
  //       → Angular redirigeait vers /login.
  //
  //  2. Ajout du padding Base64 manquant (JWT n'inclut pas le '=').
  //     Sans padding, atob() peut lever une exception sur certains navigateurs.
  //
  //  3. Utilisation de decodeURIComponent + encodage octet par octet pour
  //     décoder correctement les chaînes UTF-8 dans le payload.
  getDecodedToken(): { sub: string; role: string; exp: number } | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;   // Format JWT invalide

      // Base64Url → Base64 standard
      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
 

      // Ajout du padding '=' si nécessaire
      // (JWT omet le padding ; atob() en a besoin sur certains navigateurs)
      while (base64.length % 4 !== 0) {
        base64 += '=';
      }

      // decodeURIComponent + encodage octet par octet = support UTF-8 complet
      // (prénoms avec accents : "Saïd", "Noël", etc.)
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(json);

    } catch(e) {
      // On retourne null SANS appeler logout().
      // Si le token est vraiment invalide, le backend le rejettera (401)
      // et le composant gèrera la redirection lui-même.
      console.warn('[AuthService] getDecodedToken() : décodage échoué', e);
      return null;
    }
  }
}
