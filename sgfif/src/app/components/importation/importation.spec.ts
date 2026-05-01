import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Importation } from './importation';

describe('Importation', () => {
  let component: Importation;
  let fixture: ComponentFixture<Importation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Importation],
    }).compileComponents();

    fixture = TestBed.createComponent(Importation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
