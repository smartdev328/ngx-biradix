import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ApprovedListsComponent } from './approved-lists.component';

describe('ApprovedListsComponent', () => {
  let component: ApprovedListsComponent;
  let fixture: ComponentFixture<ApprovedListsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ApprovedListsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApprovedListsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
