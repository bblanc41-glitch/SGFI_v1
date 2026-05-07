


// src/app/services/auth.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthService } from './auth.service';

// ⚠️  CORRECTION : la version précédente avait configureTestingModule({})
//     sans aucun provider. AuthService injecte HttpClient →
//     "NullInjectorError: No provider for HttpClient!" au démarrage.
describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });
    service = TestBed.inject(AuthService);
    localStorage.clear();
  });

  afterEach(() => localStorage.clear());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getToken() retourne null si localStorage est vide', () => {
    expect(service.getToken()).toBeNull();
  });

  it('isLoggedIn() retourne false sans token', () => {
    expect(service.isLoggedIn()).toBeFalsy();//.toBeFalse()
  });

  it('isLoggedIn() retourne true avec un token', () => {
    localStorage.setItem('token', 'fake.jwt.token');
    expect(service.isLoggedIn()).toBeTruthy();//toBeTrue()
  });

  it('logout() supprime le token du localStorage', () => {
    localStorage.setItem('token', 'fake.jwt.token');
    service.logout();
    expect(service.getToken()).toBeNull();
  });

  it('getDecodedToken() retourne null sans token', () => {
    expect(service.getDecodedToken()).toBeNull();
  });

  // ── TEST CRITIQUE : vérifie que getDecodedToken() ne supprime PAS
  //    le token du localStorage en cas d'erreur de décodage.
  //    C'est le bug qui causait la redirection vers /login après saisie.
  it('getDecodedToken() retourne null SANS appeler logout() si token malformé', () => {
    localStorage.setItem('token', 'token-invalide-sans-points');
    const decoded = service.getDecodedToken();
    expect(decoded).toBeNull();
    // Le token doit toujours être présent (logout() ne doit pas avoir été appelé)
    expect(service.getToken()).toBe('token-invalide-sans-points');
  });
});




/*Version 2

// src/app/services/auth.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthService } from './auth.service';

// ⚠️  CORRECTION : la version précédente n'avait aucun provider dans
//     configureTestingModule({}). AuthService injecte HttpClient →
//     sans provideHttpClient(), Angular levait :
//     "NullInjectorError: No provider for HttpClient!"
//     et tous les tests échouaient au démarrage.
describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),         // fournit HttpClient
        provideHttpClientTesting(),  // intercepte les vraies requêtes HTTP (mock)
      ]
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getToken() retourne null si rien en localStorage', () => {
    localStorage.clear();
    expect(service.getToken()).toBeNull();
  });

  it('isLoggedIn() retourne false si pas de token', () => {
    localStorage.clear();
    expect(service.isLoggedIn()).toBeFalsy();//toBeFals
  });

  it('isLoggedIn() retourne true si un token est présent', () => {
    localStorage.setItem('token', 'fake.jwt.token');
    expect(service.isLoggedIn()).toBeTruthy();//toBeTrue
    localStorage.clear();
  });

  it('logout() supprime le token', () => {
    localStorage.setItem('token', 'fake.jwt.token');
    service.logout();
    expect(service.getToken()).toBeNull();
  });

  it('getDecodedToken() retourne null si pas de token', () => {
    localStorage.clear();
    expect(service.getDecodedToken()).toBeNull();
  });

  it('getDecodedToken() retourne null sans appeler logout() si token malformé', () => {
    // Token malformé — ne doit PAS supprimer un token valide en localStorage
    localStorage.setItem('token', 'not-a-valid-jwt');
    const decoded = service.getDecodedToken();
    expect(decoded).toBeNull();
    // Le token doit toujours être là (logout() n'a pas dû être appelé)
    expect(service.getToken()).toBe('not-a-valid-jwt');
    localStorage.clear();
  });
});*/



/*Version 1


import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';

describe('Auth', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});*/
