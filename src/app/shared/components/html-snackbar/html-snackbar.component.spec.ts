import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HtmlSnackbarComponent } from './html-snackbar.component';

describe('HtmlSnackbarComponent', () => {
  let component: HtmlSnackbarComponent;
  let fixture: ComponentFixture<HtmlSnackbarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HtmlSnackbarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HtmlSnackbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
