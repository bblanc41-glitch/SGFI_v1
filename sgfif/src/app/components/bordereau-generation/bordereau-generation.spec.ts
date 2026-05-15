import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BordereauGeneration } from './bordereau-generation';

describe('BordereauGeneration', () => {
  let component: BordereauGeneration;
  let fixture: ComponentFixture<BordereauGeneration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BordereauGeneration],
    }).compileComponents();

    fixture = TestBed.createComponent(BordereauGeneration);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
