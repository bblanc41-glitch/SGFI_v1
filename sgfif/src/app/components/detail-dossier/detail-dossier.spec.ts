import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailDossier } from './detail-dossier';

describe('DetailDossier', () => {
  let component: DetailDossier;
  let fixture: ComponentFixture<DetailDossier>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailDossier],
    }).compileComponents();

    fixture = TestBed.createComponent(DetailDossier);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
