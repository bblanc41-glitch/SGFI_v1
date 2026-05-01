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
});

/*
describe('enregistrerDossier', ()=>{
  let component : enregistrerDossier;
  let fixture: ComponentFixture<enregistrerDossier>;
});*/