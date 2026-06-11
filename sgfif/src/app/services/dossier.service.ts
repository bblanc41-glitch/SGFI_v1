// src/app/services/dossier.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dossier, DossierRecent, Stats, RapportImport, Notification, PieceJointe,HistoriqueDossier } from '../models/dossier';
import { SuiviJuridique } from '../models/suivi-juridique';

@Injectable({ providedIn: 'root' })
export class DossierService {

  private readonly api = 'http://127.0.0.1:8080/api';

  constructor(private http: HttpClient) {}

  // ── LISTE COMPLÈTE ───────────────────────────────────────────────────────
  getDossiers(): Observable<Dossier[]> {
    return this.http.get<Dossier[]>(`${this.api}/dossiers`);
  }

  // ── SAISIE MANUELLE ──────────────────────────────────────────────────────
  creer(dossier: Dossier): Observable<Dossier> {
    return this.http.post<Dossier>(`${this.api}/dossiers`, dossier);
  }

  update(id: number, dossier: Partial<Dossier>): Observable<Dossier> {
    return this.http.put<Dossier>(`${this.api}/dossiers/${id}`, dossier);
  }

  getById(id: number): Observable<Dossier> {
    return this.http.get<Dossier>(`${this.api}/dossiers/${id}`);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/dossiers/${id}`);
  }

  // ── IMPORTATION CCR ──────────────────────────────────────────────────────
  importerCcr(formData: FormData): Observable<RapportImport> {
    return this.http.post<RapportImport>(`${this.api}/importation`, formData);
  }

  changerStatut(id: number, statut: string, motif?: string): Observable<Dossier> {
    const body = { statut, motif };
    return this.http.patch<Dossier>(`${this.api}/dossiers/${id}/statut`, body);
  }

  // ── STATISTIQUES ───────────────────────────────────────────────────────
  getStats(): Observable<Stats> {
    return this.http.get<Stats>(`${this.api}/dossiers/stats`);
  }

  getRecent(limit: number): Observable<DossierRecent[]> {
    return this.http.get<DossierRecent[]>(`${this.api}/dossiers/recent?limit=${limit}`);
  }

  // ── NOTIFICATIONS ────────────────────────────────────────────────────────
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

  // ── PIECES JOINTES ───────────────────────────────────────────────────────
  getPieces(dossierId: number): Observable<PieceJointe[]> {
    return this.http.get<PieceJointe[]>(`${this.api}/dossiers/${dossierId}/pieces`);
  }

  uploadPiece(id: number, formData: FormData): Observable<any> {
    return this.http.post(`${this.api}/dossiers/${id}/pieces`, formData);
  }

  downloadPiece(dossierId: number, chemin: string): Observable<Blob> {
    return this.http.get(`${this.api}/dossiers/${dossierId}/pieces`, {
      params: { fichier: chemin },
      responseType: 'blob'
    });
  }

  deletePiece(dossierId: number, pieceId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/dossiers/${dossierId}/pieces/${pieceId}`);
  }

  // ── BORDEREAU ───────────────────────────────────────────────────────────
  genererBordereauEnvoi(payload: { ids: number[], referenceExterne?: string }): Observable<Blob> {
    return this.http.post(`${this.api}/dossiers/bordereaux/envoi`, payload, { responseType: 'blob' });
  }

  genererBordereau(id: number): Observable<Blob> {
    return this.http.get(`${this.api}/dossiers/${id}/bordereau`, { responseType: 'blob' });
  }

  // ── SUIVI JURIDIQUE (CRUD complet) ───────────────────────────────────────
  getSuivis(refInterne: string): Observable<SuiviJuridique[]> {
    return this.http.get<SuiviJuridique[]>(`${this.api}/dossiers/${refInterne}/suivis`);
  }

  createSuivi(refInterne: string, suivi: Partial<SuiviJuridique>): Observable<SuiviJuridique> {
    return this.http.post<SuiviJuridique>(`${this.api}/dossiers/${refInterne}/suivis`, suivi);
  }

  updateSuivi(refInterne: string, suivi: Partial<SuiviJuridique>): Observable<SuiviJuridique> {
    return this.http.put<SuiviJuridique>(`${this.api}/dossiers/${refInterne}/suivis`, suivi);
  }

  deleteSuivi(refInterne: string, referenceExterne: string, typeAudience: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/dossiers/${refInterne}/suivis/${referenceExterne}/${typeAudience}`);
  }

  // Ajouter cette méthode dans la classe DossierService
getHistorique(id: number): Observable<HistoriqueDossier[]> {
  return this.http.get<HistoriqueDossier[]>(`${this.api}/dossiers/${id}/historique`);
}
}
