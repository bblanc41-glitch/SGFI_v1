import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dossier, HistoriqueDossier, RapportImport, Stats } from '../models/dossier';

/*
  Service Angular — accès à tous les endpoints /api/dossiers et /api/importation.
  Le token JWT est automatiquement ajouté par JwtInterceptor (app.config.ts).
 */
@Injectable({ providedIn: 'root' })
export class DossierService {

  private readonly api = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // ── Dossiers ──────────────────────────────────────────────────────────

  /** Récupère tous les dossiers. */
  getDossiers(): Observable<Dossier[]> {
    return this.http.get<Dossier[]>(`${this.api}/dossiers`);
  }

  /** Récupère un dossier par son identifiant. */
  getDossierById(id: number): Observable<Dossier> {
    return this.http.get<Dossier>(`${this.api}/dossiers/${id}`);
  }

  /** Recherche multi-critères (IP, bénéficiaire, CIN, téléphone, référence). */
  rechercher(terme: string): Observable<Dossier[]> {
    return this.http.get<Dossier[]>(`${this.api}/dossiers/recherche`, { params: { terme } });
  }

  /** Filtre par statut. */
  getParStatut(statut: string): Observable<Dossier[]> {
    return this.http.get<Dossier[]>(`${this.api}/dossiers/statut/${statut}`);
  }

  /** Crée un dossier (saisie manuelle). */
  creer(dossier: Dossier): Observable<Dossier> {
    return this.http.post<Dossier>(`${this.api}/dossiers`, dossier);
  }

  /** Modifie les champs d'un dossier (patch partiel). */
  modifier(id: number, patch: Partial<Dossier>): Observable<Dossier> {
    return this.http.put<Dossier>(`${this.api}/dossiers/${id}`, patch);
  }

  /**
   * Change le statut d'un dossier (workflow).
   * @param motif obligatoire pour les statuts CLOTURE et INCOMPLET
   */
  changerStatut(id: number, statut: string, motif?: string): Observable<Dossier> {
    return this.http.patch<Dossier>(`${this.api}/dossiers/${id}/statut`, { statut, motif });
  }

  /** Récupère l'historique des actions d'un dossier. */
  getHistorique(id: number): Observable<HistoriqueDossier[]> {
    return this.http.get<HistoriqueDossier[]>(`${this.api}/dossiers/${id}/historique`);
  }

  /** Statistiques pour le tableau de bord. */
  getStats(): Observable<Stats> {
    return this.http.get<Stats>(`${this.api}/dossiers/stats`);
  }

  //Importation ───────────────────────────────────────────────────────

  /** Envoie un fichier Excel CCR et retourne le rapport d'importation. */
  importerCcr(formData: FormData): Observable<RapportImport> {
    return this.http.post<RapportImport>(`${this.api}/importation`, formData);
  }

    //enregistrerDossier(){}

}

// src/app/services/dossier.service.ts
/* Version3

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
/*import { Injectable } from '@angular/core';
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