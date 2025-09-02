import { Component } from '@angular/core';
import { DataService } from '../data-service.service';
import { FormsModule } from '@angular/forms';
import { ngFor } from '@angular/common';

@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [FormsModule, ngFor],
  templateUrl: './filters.component.html',
  styleUrl: './filters.component.less'
})
export class FiltersComponent {
  injuryfilter: boolean | undefined;
  nameFilter: string = '';
  countryFilter: string = '';
  filterGender: string = '';
  countrylist: any[] = [];
  constructor(public ds: DataService) { }
  
  ngoninit() {
    this.ds.injuryfilter.subscribe(value => {
      this.injuryfilter = value;
    });
    this.ds.nameFilter.subscribe(value => {
      this.nameFilter = value;
    } );
    this.ds.filterGender.subscribe(value => {
      this.filterGender = value;
    } );
    this.ds.countryFilter.subscribe(value => {
      this.countryFilter = value;
    } );
    this.ds.countrylist.subscribe(value => {
      this.countrylist = value;
    } );
  }
  applyFilters() {
    this.ds.applyFilters();
  }

  resetFilters() {
    this.ds.resetFilters();
  }
}
