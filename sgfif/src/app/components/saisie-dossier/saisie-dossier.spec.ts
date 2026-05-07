// src/app/components/saisie-dossier/saisie-dossier.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { routes } from '../../app.routes';

import { SaisieDossier } from './saisie-dossier';

// ⚠️  CORRECTION : la version précédente avait configureTestingModule
//     avec uniquement imports: [SaisieDossier], sans aucun provider.
//     SaisieDossier injecte DossierService (→ HttpClient) et Router →
//     "NullInjectorError" au démarrage de chaque test.
describe('SaisieDossier', () => {
  let component: SaisieDossier;
  let fixture: ComponentFixture<SaisieDossier>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaisieDossier, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(routes),
      ]
    }).compileComponents();

    fixture   = TestBed.createComponent(SaisieDossier);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  // ── CRÉATION ────────────────────────────────────────────────────────────
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── ÉTAT INITIAL ─────────────────────────────────────────────────────────
  it('le formulaire est invalide au démarrage (champs obligatoires vides)', () => {
    expect(component.form.invalid).toBeTrue();
  });

  it('chargement, succes et erreurMessage sont à leur valeur initiale', () => {
    expect(component.chargement).toBeFalse();
    expect(component.succes).toBeFalse();
    expect(component.erreurMessage).toBe('');
  });

  // ── VALIDATION DES CHAMPS OBLIGATOIRES ──────────────────────────────────
  it('ip est requis', () => {
    component.form.get('ip')!.setValue('');
    expect(component.form.get('ip')!.hasError('required')).toBeTrue();
  });

  it('numeroFacture est requis', () => {
    component.form.get('numeroFacture')!.setValue('');
    expect(component.form.get('numeroFacture')!.hasError('required')).toBeTrue();
  });

  it('le formulaire est valide quand ip et numeroFacture sont renseignés', () => {
    component.form.patchValue({
      ip:            'IP-2025-001',
      numeroFacture: 'FACT-2025-001',
    });
    expect(component.form.valid).toBeTrue();
  });

  it('ip invalide si > 30 caractères', () => {
    component.form.get('ip')!.setValue('A'.repeat(31));
    expect(component.form.get('ip')!.hasError('maxlength')).toBeTrue();
  });

  // ── RESET ────────────────────────────────────────────────────────────────
  it('onReset() remet le formulaire à zéro', () => {
    component.form.patchValue({ ip: 'IP-001', numeroFacture: 'FACT-001' });
    component.erreurMessage = 'une erreur';
    component.succes        = true;

    component.onReset();

    expect(component.form.get('ip')!.value).toBeFalsy();
    expect(component.erreurMessage).toBe('');
    expect(component.succes).toBeFalsy();//.toBeFalse
  });

  // ── SUBMIT AVEC FORMULAIRE INVALIDE ─────────────────────────────────────
  it('onSubmit() avec formulaire vide marque tous les champs comme touched', () => {
    component.onSubmit();
    expect(component.form.get('ip')!.touched).toBeTruthy();//.toBeTrue()
    expect(component.form.get('numeroFacture')!.touched).toBeTruthy();//.toBeTrue()
  });

  it('onSubmit() ne lance pas la requête si le formulaire est invalide', () => {
    // chargement doit rester false si le formulaire est invalide
    component.onSubmit();
    expect(component.chargement).toBeFalsy();//.toBeFalse()
  });
});




/*version 2


import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaisieDossier } from './saisie-dossier';

describe('SaisieDossier', () => {
  let component: SaisieDossier;
  let fixture: ComponentFixture<SaisieDossier>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaisieDossier],
    }).compileComponents();

    fixture = TestBed.createComponent(SaisieDossier);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});*/

/*
describe('enregistrerDossier', ()=>{
  let component : enregistrerDossier;
  let fixture: ComponentFixture<enregistrerDossier>;
});*/