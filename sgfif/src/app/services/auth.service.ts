import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private loginUrl = 'http://localhost:8080/api/auth/login';

  constructor(private http: HttpClient) {}

  login(credentials: { username: string; password: string }): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(this.loginUrl, credentials);
  }

  logout(): void {
    localStorage.removeItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // ── DÉCODAGE JWT ──────────────────────────────────────────────────────────
  // AJOUT NÉCESSAIRE : dashboard.ts et app.ts appellent cette méthode
  // pour lire le username et le rôle depuis le token sans appel backend.
  // La vérification de signature reste côté serveur (JwtAuthFilter.java).
  getDecodedToken(): { sub: string; role: string; iat: number; exp: number } | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      // Base64URL → UTF-8
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64).split('').map(c =>
          '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join('')
      );
      return JSON.parse(json);
    } catch {
      this.logout(); // token malformé → nettoyage
      return null;
    }
  }
}

/*import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Token } from '@angular/compiler';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private loginUrl= 'http://localhost:8080/api/auth/login';

  constructor(private http: HttpClient) { }
  
  //Envoie les identifiants au Backend pour verification en base de donnees
  login(credentials: { username: string; password: string }): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(this.loginUrl, credentials);
  }

  logout(): void {
    localStorage.removeItem('token');
  }
 
  getToken(): string | null {
    return localStorage.getItem('token');
  }
 
  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}*/
