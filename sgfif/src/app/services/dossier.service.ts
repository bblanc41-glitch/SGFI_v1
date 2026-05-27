// src/app/services/dossier.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dossier, DossierRecent, Stats, RapportImport, Notification,PieceJointe } from '../models/dossier';
import { SuiviJuridique } from '../models/suivi-juridique';
/**
 * DossierService — toutes les requêtes HTTP vers le backend Spring Boot.
 *
 * Le JwtInterceptor (enregistré dans app.config.ts via withInterceptors)
 * ajoute automatiquement l'en-tête Authorization: Bearer <token>
 * sur chaque requête → pas besoin de gérer les headers ici.
 */
@Injectable({ providedIn: 'root' })
export class DossierService {

  //private readonly api = 'http://localhost:8080/api';
  private readonly api = 'http://127.0.0.1:8080/api';//Pour résoudre Pb lenteur

  constructor(private http: HttpClient) {}

  // ── LISTE COMPLÈTE ───────────────────────────────────────────────────────
  getDossiers(): Observable<Dossier[]> {
    return this.http.get<Dossier[]>(`${this.api}/dossiers`);
  }

  // ── SAISIE MANUELLE ──────────────────────────────────────────────────────
  creer(dossier: Dossier): Observable<Dossier> {
    return this.http.post<Dossier>(`${this.api}/dossiers`, dossier);
  }

 //Mis à jour du dossier
  update(id: number, dossier: Partial<Dossier>): Observable<Dossier> {
    return this.http.put<Dossier>(`${this.api}/dossiers/${id}`, dossier);
  }

  uploadPiece(id: number, formData: FormData): Observable<any> {
  return this.http.post(`${this.api}/dossiers/${id}/pieces`, formData);
}

  // ── IMPORTATION CCR ──────────────────────────────────────────────────────
   importerCcr(formData: FormData): Observable<RapportImport> {
    return this.http.post<RapportImport>(`${this.api}/importation`, formData);
    // Note : pas de { responseType: 'text' } — le backend renvoie du JSON
    // (voir ImportationController.java → ResponseEntity<Map<String, Object>>)
  }

  changerStatut(id: number, statut: string, motif?: string): Observable<Dossier> {
    const body = { statut, motif };
    return this.http.patch<Dossier>(`${this.api}/dossiers/${id}/statut`, body);
  }



  //Suppression dun dossier
  delete(id: number): Observable<void> {
  return this.http.delete<void>(`${this.api}/dossiers/${id}`);
  }

  // ── STATISTIQUES (tableau de bord) ───────────────────────────────────────
  // Retourne { total, enAttente, envoyeAvocat, enInstance, cloture, incomplet, montantImpaye }
  getStats(): Observable<Stats> {
    return this.http.get<Stats>(`${this.api}/dossiers/stats`);
  }

  // ── DOSSIERS RÉCENTS (tableau de bord) ───────────────────────────────────
  getRecent(limit: number ): Observable<DossierRecent[]> {
    return this.http.get<DossierRecent[]>(`${this.api}/dossiers/recent?limit=${limit}`);
  }

  // ── NOTIFICATIONS ────────────────────────────────────────────────────────
  

  getById(ip: number): Observable<Dossier> {
    return this.http.get<Dossier>(`${this.api}/dossiers/${ip}`);
  }

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.api}/notifications`);
  }

  getNombreNonLues(): Observable<number> {
    return this.http.get<number>(`${this.api}/notifications/non-lues`);
  }

  marquerCommeLue(id: number): Observable<void> {
    return this.http.put<void>(`${this.api}/notifications/${id}/lu`, {});
  }

  supprimerNotification(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/notifications/${id}`);
  }




  /*
  getById(id: number): Observable<Dossier> {
    return this.http.get<Dossier>(`${this.api}/dossiers/${id}`);
  }
  */


  /*
  
  search(query: string): Observable<Dossier[]> {  
    return this.http.get<Dossier[]>(`${this.api}/dossiers/search?query=${query}`);
  }

  uploadPieces(dossierId: number, files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    return this.http.post(`${this.api}/dossiers/${dossierId}/pieces`, formData);
  }

  importExcel(formData: FormData): Observable<any> {
    return this.http.post(`${this.api}/dossiers/import`, formData);
  }

  downloadTemplate(): Observable<Blob> {
    return this.http.get(`${this.api}/dossiers/import/template`, { responseType: 'blob' });
  }

  */
///////////////Pieces justificatives
getPieces(dossierId: number): Observable<PieceJointe[]> {
  return this.http.get<PieceJointe[]>(`${this.api}/dossiers/${dossierId}/pieces`);
}

downloadPiece(dossierId: number, chemin: string): Observable<Blob> {
  // Endpoint GET avec paramètre "fichier" (selon votre contrôleur existant)
  return this.http.get(`${this.api}/dossiers/${dossierId}/pieces`, {
    params: { fichier: chemin },
    responseType: 'blob'
  });
}

deletePiece(dossierId: number, pieceId: number): Observable<void> {
  return this.http.delete<void>(`${this.api}/dossiers/${dossierId}/pieces/${pieceId}`);
}


/////////////////Generer bordereau
genererBordereauEnvoi(payload: { ids: number[], referenceExterne?: string }): Observable<Blob> {
  return this.http.post(`${this.api}/dossiers/bordereaux/envoi`, payload, { responseType: 'blob' });
}


genererBordereau(id: number): Observable<Blob> {
  return this.http.get(`${this.api}/dossiers/${id}/bordereau`, { responseType: 'blob' });
}/**/


// Suivi juridique (multi)
getSuivis(refInterne: string): Observable<SuiviJuridique[]> {
  return this.http.get<SuiviJuridique[]>(`${this.api}/dossiers/${refInterne}/suivis`);
}

addOrUpdateSuivi(refInterne: string, suivi: Partial<SuiviJuridique>): Observable<SuiviJuridique> {
  return this.http.post<SuiviJuridique>(`${this.api}/dossiers/${refInterne}/suivis`, suivi);
}

deleteSuivi(refInterne: string, typeAudience: string): Observable<void> {
  return this.http.delete<void>(`${this.api}/dossiers/${refInterne}/suivis/${typeAudience}`);
}


}
