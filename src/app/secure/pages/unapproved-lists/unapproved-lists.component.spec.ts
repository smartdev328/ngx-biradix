import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UnapprovedListsComponent } from './unapproved-lists.component';

describe('UnapprovedListsComponent', () => {
  let component: UnapprovedListsComponent;
  let fixture: ComponentFixture<UnapprovedListsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UnapprovedListsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UnapprovedListsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
