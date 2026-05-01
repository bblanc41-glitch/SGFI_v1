import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListeDossiers } from './liste-dossiers';

describe('ListeDossiers', () => {
  let component: ListeDossiers;
  let fixture: ComponentFixture<ListeDossiers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListeDossiers],
    }).compileComponents();

    fixture = TestBed.createComponent(ListeDossiers);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
