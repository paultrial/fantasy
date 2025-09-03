import { Component, OnInit, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AtheleteListComponent } from './athelete-list/athelete-list.component';
import { FiltersComponent } from './filters/filters.component';
import { TeamComponent } from './team/team.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TeamComponent, MatIconModule, RouterOutlet, FormsModule, AtheleteListComponent, FiltersComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.less'
})
export class AppComponent {
  title = 'P.B. Fantasy DH';
}
