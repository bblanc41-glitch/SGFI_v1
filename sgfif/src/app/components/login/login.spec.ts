import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
// ↑ CORRECTION : FormsModule remplacé par ReactiveFormsModule (composant mis à jour)

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
// ↑ Les deux sont nécessaires : provideHttpClient crée le client,
//   provideHttpClientTesting remplace les vraies requêtes par des mocks

import { provideRouter } from '@angular/router';
import { routes } from '../../app.routes';
// ↑ AJOUTÉ : Login injecte Router → le test a besoin d'un routeur configuré

import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login, ReactiveFormsModule],
      // ↑ Login est standalone → il va dans imports[], pas declarations[]
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(routes)
        // ↑ Les providers vont dans providers[], jamais dans imports[]
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});