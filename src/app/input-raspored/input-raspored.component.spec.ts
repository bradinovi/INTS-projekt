import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InputRasporedComponent } from './input-raspored.component';

describe('InputRasporedComponent', () => {
  let component: InputRasporedComponent;
  let fixture: ComponentFixture<InputRasporedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InputRasporedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputRasporedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
