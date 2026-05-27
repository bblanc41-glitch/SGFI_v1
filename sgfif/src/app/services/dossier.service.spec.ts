// src/app/services/dossier.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { DossierService } from './dossier.service';
import { Dossier } from '../models/dossier';

describe('DossierService', () => {
  let service: DossierService;
  let httpMock: HttpTestingController;

  const API = 'http://localhost:8080/api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DossierService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });
    service  = TestBed.inject(DossierService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getDossiers() appelle GET /api/dossiers', () => {
    service.getDossiers().subscribe(data => expect(data).toEqual([]));
    httpMock.expectOne(`${API}/dossiers`).flush([]);
  });

  it('creer() appelle POST /api/dossiers', () => {
    const dossier = { ip: 'IP-001', numeroFacture: 'FACT-001' } as Dossier;
    service.creer(dossier).subscribe(d => expect(d.ip).toBe('IP-001'));
    const req = httpMock.expectOne(`${API}/dossiers`);
    expect(req.request.method).toBe('POST');
    req.flush(dossier);
  });

  it('importerCcr() appelle POST /api/importation', () => {
    const formData = new FormData();
    const rapport  = { importes: 2, doublons: 0, erreurs: 0, details: [] };
    service.importerCcr(formData).subscribe(r => expect(r.importes).toBe(2));
    const req = httpMock.expectOne(`${API}/importation`);
    expect(req.request.method).toBe('POST');
    req.flush(rapport);
  });

  it('getStats() appelle GET /api/dossiers/stats', () => {
    const stats = { total: 5, enAttente: 2, envoyeAvocat: 1,
                    enInstance: 0, cloture: 1, incomplet: 1, montantImpaye: 10000 };
    service.getStats().subscribe(s => expect(s.total).toBe(5));
    httpMock.expectOne(`${API}/dossiers/stats`).flush(stats);
  });

  it('getRecent() appelle GET /api/dossiers/recent?limit=5', () => {
    service.getRecent(5).subscribe(data => expect(data).toEqual([]));
    httpMock.expectOne(`${API}/dossiers/recent?limit=5`).flush([]);
  });
});
