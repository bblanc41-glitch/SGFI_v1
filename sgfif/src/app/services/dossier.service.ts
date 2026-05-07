// src/app/services/dossier.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dossier, DossierRecent, Stats, RapportImport, Notification } from '../models/dossier';

/**
 * DossierService — toutes les requêtes HTTP vers le backend Spring Boot.
 *
 * Le JwtInterceptor (enregistré dans app.config.ts via withInterceptors)
 * ajoute automatiquement l'en-tête Authorization: Bearer <token>
 * sur chaque requête → pas besoin de gérer les headers ici.
 *
 * CORRECTIONS APPLIQUÉES :
 *  - enregistrerDossier() → renommé creer()          (appelé par saisie-dossier.ts)
 *  - importCcr()          → renommé importerCcr()     (appelé par importation.ts)
 *  - Ajout getStats()                                 (appelé par dashboard.ts)
 *  - Ajout getRecent()                                (appelé par dashboard.ts)
 *  - Ajout getNotifications()                         (appelé par dashboard.ts)
 */
@Injectable({ providedIn: 'root' })
export class DossierService {

  private readonly api = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // ── LISTE COMPLÈTE ───────────────────────────────────────────────────────
  getDossiers(): Observable<Dossier[]> {
    return this.http.get<Dossier[]>(`${this.api}/dossiers`);
  }

  // ── SAISIE MANUELLE ──────────────────────────────────────────────────────
  // Anciennement "enregistrerDossier" — renommé pour correspondre
  // à l'appel this.dossierService.creer() dans saisie-dossier.ts
  creer(dossier: Dossier): Observable<Dossier> {
    return this.http.post<Dossier>(`${this.api}/dossiers`, dossier);
  }

  // ── IMPORTATION CCR ──────────────────────────────────────────────────────
  // Anciennement "importCcr" — renommé pour correspondre
  // à l'appel this.dossierService.importerCcr() dans importation.ts
  // Retourne un RapportImport { importes, doublons, erreurs, details[] }
  importerCcr(formData: FormData): Observable<RapportImport> {
    return this.http.post<RapportImport>(`${this.api}/importation`, formData);
    // Note : pas de { responseType: 'text' } — le backend renvoie du JSON
    // (voir ImportationController.java → ResponseEntity<Map<String, Object>>)
  }

  // ── STATISTIQUES (tableau de bord) ───────────────────────────────────────
  // GET /api/dossiers/stats
  // Retourne { total, enAttente, envoyeAvocat, enInstance, cloture, incomplet, montantImpaye }
  getStats(): Observable<Stats> {
    return this.http.get<Stats>(`${this.api}/dossiers/stats`);
  }

  // ── DOSSIERS RÉCENTS (tableau de bord) ───────────────────────────────────
  // GET /api/dossiers/recent?limit=5
  getRecent(limit: number = 5): Observable<DossierRecent[]> {
    return this.http.get<DossierRecent[]>(`${this.api}/dossiers/recent?limit=${limit}`);
  }

  // ── NOTIFICATIONS ────────────────────────────────────────────────────────
  // GET /api/notifications
  // L'erreur est gérée silencieusement dans dashboard.ts (badge reste à 0)
  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.api}/notifications`);
  }
}

/* Version 3
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Dossier, DossierRecent, HistoriqueDossier, Notification, RapportImport, Stats } from '../models/dossier';
 
///Service Angular — accès à tous les endpoints /api/dossiers et /api/importation.
  //Le token JWT est automatiquement ajouté par JwtInterceptor (app.config.ts).
 
@Injectable({ providedIn: 'root' })
export class DossierService {

  private readonly api = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // ── Dossiers -----------------------------------------------------

  // Récupère tous les dossiers.
  getDossiers(): Observable<Dossier[]> {
    return this.http.get<Dossier[]>(`${this.api}/dossiers`);
  }

  // Récupère un dossier par son identifiant. 
  getDossierById(id: number): Observable<Dossier> {
    return this.http.get<Dossier>(`${this.api}/dossiers/${id}`);
  }

  // Recherche multi-critères (IP, bénéficiaire, CIN, téléphone, référence). 
  rechercher(terme: string): Observable<Dossier[]> {
    return this.http.get<Dossier[]>(`${this.api}/dossiers/recherche`, { params: { terme } });
  }

  // Filtre par statut
  getParStatut(statut: string): Observable<Dossier[]> {
    return this.http.get<Dossier[]>(`${this.api}/dossiers/statut/${statut}`);
  }

 
  // ── DOSSIERS RÉCENTS ─────────────────────────────────────────────────────
  // AJOUT : utilisé par le dashboard pour afficher les 5 derniers dossiers.
  // Endpoint Spring Boot à créer : GET /api/dossiers/recent?limit=5
  // catchError → tableau vide si l'endpoint n'est pas encore implémenté
  getRecent(limit: number = 5): Observable<DossierRecent[]> {
    return this.http.get<DossierRecent[]>(
      `${this.api}/dossiers/recent`, { params: { limit: limit.toString() } }
    ).pipe(catchError(() => of([])));
  }
 
  // ── STATISTIQUES ─────────────────────────────────────────────────────────
  // Retourne l'objet Stats (total, enAttente, envoyeAvocat…)
  getStats(): Observable<Stats> {
    return this.http.get<Stats>(`${this.api}/dossiers/stats`).pipe(
      catchError(() => of({
        total: 0, enAttente: 0, envoyeAvocat: 0,
        enInstance: 0, cloture: 0, incomplet: 0, montantImpaye: 0
      }))
    );
  }

    // ── NOTIFICATIONS ────────────────────────────────────────────────────────
  // AJOUT : badge de notifications dynamique dans dashboard et sidebar.
  // Endpoint optionnel : GET /api/notifications
  // catchError → tableau vide si non implémenté (badge reste à 0)
  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.api}/notifications`)
      .pipe(catchError(() => of([])));
  }
 
 // ── CRUD ─────────────────────────────────────────────────────────────────
 
  //Crée un dossier (saisie manuelle). 
  creer(dossier: Dossier): Observable<Dossier> {
    return this.http.post<Dossier>(`${this.api}/dossiers`, dossier);
  }

  // ENREGISTRER UN DOSSIER
 enregistrerDossier(dossier: Dossier): Observable<Dossier> {
    return this.creer(dossier);
  }

  /// Modifie les champs d'un dossier (patch partiel).
  modifier(id: number, patch: Partial<Dossier>): Observable<Dossier> {
    return this.http.put<Dossier>(`${this.api}/dossiers/${id}`, patch);
  }

  //Change le statut d'un dossier (workflow).
   // motif obligatoire pour les statuts CLOTURE et INCOMPLET
   
  changerStatut(id: number, statut: string, motif?: string): Observable<Dossier> {
    return this.http.patch<Dossier>(`${this.api}/dossiers/${id}/statut`, { statut, motif });
  }

 // ── HISTORIQUE ───────────────────────────────────────────────────────────

  //Récupère l'historique des actions d'un dossier. 
  getHistorique(id: number): Observable<HistoriqueDossier[]> {
    return this.http.get<HistoriqueDossier[]>(`${this.api}/dossiers/${id}/historique`);
  }

    // ── IMPORTATION ──────────────────────────────────────────────────────────
 
  importerCcr(formData: FormData): Observable<RapportImport> {
    return this.http.post<RapportImport>(`${this.api}/importation`, formData);
  }
 
  // Alias pour compatibilité avec importation.ts existant
  importCcr(formData: FormData): Observable<string> {
    return this.http.post(`${this.api}/importation`, formData, { responseType: 'text' });
  }

  //Statistiques pour le tableau de bord.
  getStats(): Observable<Stats> {
    return this.http.get<Stats>(`${this.api}/dossiers/stats`);
  }
  

}*/




// src/app/services/dossier.service.ts
/* Version 2

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dossier } from '../models/dossier';
*/
/*
  Plus besoin de gérer manuellement les headers Authorization ici.
 Le JwtInterceptor (enregistré dans app.config.ts) les ajoute
 automatiquement à chaque requête HTTP sortante.
 */
/*
@Injectable({ providedIn: 'root' })
export class DossierService {

  private readonly api = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  getDossiers(): Observable<Dossier[]> {
    return this.http.get<Dossier[]>(`${this.api}/dossiers`);
  }

  enregistrerDossier(dossier: Dossier): Observable<Dossier> {
    return this.http.post<Dossier>(`${this.api}/dossiers`, dossier);
  }

  importCcr(formData: FormData): Observable<string> {
    return this.http.post(`${this.api}/importation`, formData, { responseType: 'text' });
  }
}
*/ 



/*Version1

import { Injectable } from '@angular/core';
import { HttpClient,HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dossier } from '../models/dossier';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class DossierService {
  // URL du Backend Spring Boot (Eclipse)
  private apiUrl = 'http://localhost:8080/api';//dossiers

  constructor(private http: HttpClient, private authService: AuthService) { }

  // En-têtes JSON + JWT pour les requêtes protégées 
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
  }

  // Pour la Saisie Manuelle
 enregistrerDossier(dossier: Dossier): Observable<Dossier> {
    return this.http.post<Dossier>(`${this.apiUrl}/dossiers`, dossier, {
      headers: this.getHeaders()
    });
  }*/

 // Pour la Liste des dossiers 
  /*getDossiers(): Observable<Dossier[]> {
    return this.http.get<Dossier[]>(this.apiUrl);
  }*/

    /* Version1 sans le jwt.interceptor.ts
  getDossiers(): Observable<Dossier[]> {
    return this.http.get<Dossier[]>(`${this.apiUrl}/dossiers`, {
      headers: this.getHeaders()
    });
  }*/ 
 /*getDossiers(): Observable<Dossier[]> {
  return this.http.get<Dossier[]>(`${this.apiUrl}/dossiers`); // Plus besoin de {headers: ...}
}

  // Pour l'Importation Massive CCR
 importCcr(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/importation`, formData, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.authService.getToken()}`
        // Content-Type intentionnellement absent (multipart auto-géré)
      })
    });
  }

 
 
}*/