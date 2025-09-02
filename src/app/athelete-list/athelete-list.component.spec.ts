import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AtheleteListComponent } from './athelete-list.component';

describe('AtheleteListComponent', () => {
  let component: AtheleteListComponent;
  let fixture: ComponentFixture<AtheleteListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AtheleteListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AtheleteListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
