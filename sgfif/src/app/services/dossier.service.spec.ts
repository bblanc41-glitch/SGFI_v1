// src/app/services/dossier.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
// CORRECTION : provideHttpClientTesting ne va pas dans imports[] —
// c'est un provider, il doit aller dans providers[].
// Le mettre dans imports[] ne provoque pas d'erreur visible mais
// HttpClient n'est pas correctement mocké → les tests échouent silencieusement.
import { DossierService } from './dossier.service';

describe('DossierService', () => {
  let service: DossierService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DossierService,
        provideHttpClient(),         // HttpClient réel
        provideHttpClientTesting()   // Remplace les vraies requêtes par des mocks
      ]
    });
    service = TestBed.inject(DossierService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});


/*import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DossierService } from './dossier.service';

describe('DossierService', () => {
  let service: DossierService;

  /*beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DossierService);
  });*/
 /* beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [provideHttpClientTesting], // Injecter le module de test
      providers: [DossierService]
    });
    service = TestBed.inject(DossierService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});*/

