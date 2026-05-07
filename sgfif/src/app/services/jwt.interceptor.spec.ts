/* version 2

// src/app/services/jwt.interceptor.spec.ts



import { TestBed }          from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { jwtInterceptor } from './jwt.interceptor';

// ⚠️  CORRECTION COMPLÈTE : la version précédente tentait de faire :
//
//     import { JwtInterceptor } from './jwt.interceptor';   // ← n'existe pas
//     service = TestBed.inject(JwtInterceptor);             // ← ne fonctionne pas
//
//  jwtInterceptor est une FONCTION (HttpInterceptorFn), pas une classe.
//  Un intercepteur fonctionnel ne peut pas être injecté via TestBed.inject().
//  Il doit être enregistré avec withInterceptors([jwtInterceptor]) et testé
//  en observant les requêtes HTTP capturées par HttpTestingController.

describe('jwtInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        // L'intercepteur est enregistré exactement comme dans app.config.ts
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
      ]
    });

    http     = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();   // vérifie qu'aucune requête inattendue ne reste en attente
    localStorage.clear();
  });

  it('ajoute le header Authorization quand un token est présent', () => {
    localStorage.setItem('token', 'mon-token-de-test');

    http.get('/api/dossiers').subscribe();

    const req = httpMock.expectOne('/api/dossiers');
    expect(req.request.headers.get('Authorization'))
      .toBe('Bearer mon-token-de-test');

    req.flush([]);  // simuler une réponse vide du serveur
  });

  it("n'ajoute PAS le header Authorization quand il n'y a pas de token", () => {
    // localStorage est vide (afterEach garantit le nettoyage)

    http.get('/api/dossiers').subscribe();

    const req = httpMock.expectOne('/api/dossiers');
    expect(req.request.headers.has('Authorization')).toBeFalsy();//toBeFalse

    req.flush([]);
  });
});*/



/*Version1

import { TestBed } from '@angular/core/testing';

import { JwtInterceptor } from './jwt.interceptor';

describe('JwtInterceptor', () => {
  let service: JwtInterceptor;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JwtInterceptor);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});*/
