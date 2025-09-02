import { Component, OnInit } from '@angular/core';
import { DataService } from '../data-service.service';
import { FormsModule } from '@angular/forms';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [FormsModule, NgFor],
  templateUrl: './filters.component.html',
  styleUrl: './filters.component.less'
})
export class FiltersComponent implements OnInit {
  filters = {
    injuryfilter: undefined,
    nameFilter: '',
    countryFilter: '',
    filterGender: '',
    totalPointsfilter: {
      min: undefined,
      max: undefined
    },
    roundFilters: <any>[],
    weightedPointDeltaFilter: {
      min: undefined,
      max: undefined
    },
    weightedPriceDeltaFilter: {
      min: undefined,
      max: undefined
    }
  }
  rounds = this.ds.rounds;
  roundsAliases = this.ds.roundsAliases;
  countrylist: any[] = [];

  minweightedPointDelta!: number;
  maxweightedPointDelta!: number;
  minweightedPriceDelta!: number;
  maxweightedPriceDelta!: number;

  constructor(public ds: DataService) {
    this.ds.rounds.forEach(r => {
      this.filters.roundFilters[r] = {
        min: undefined,
        max: undefined
      }
    });
  }

  ngOnInit() {
    this.ds.countrylist.subscribe(cl => {
      this.countrylist = cl;
    });

    this.ds.minweightedPointDelta.subscribe((x:number) => this.minweightedPointDelta = x);
    this.ds.maxweightedPointDelta.subscribe((x:number) => this.maxweightedPointDelta = x);
    this.ds.minweightedPriceDelta.subscribe((x:number) => this.minweightedPriceDelta = x);
    this.ds.maxweightedPriceDelta.subscribe((x:number) => this.maxweightedPriceDelta = x);
  }
  applyFilters() {
    this.ds.applyFilters(this.filters);
  }

  resetFilters() {
    this.filters.totalPointsfilter = {
      min: undefined,
      max: undefined
    }
    this.filters.filterGender = '';
    // this.filters.filteredAthletes.next([...this.filters.data]);
    this.ds.rounds.forEach(r => {
      this.filters.roundFilters[r] = {
        min: undefined,
        max: undefined
      }
    });

    this.filters.weightedPointDeltaFilter = {
      min: undefined,
      max: undefined
    }
    this.filters.weightedPriceDeltaFilter = {
      min: undefined,
      max: undefined
    }

    this.filters.injuryfilter = undefined;
    this.filters.nameFilter = '';
    this.filters.countryFilter = '';
    this.ds.applyFilters(this.filters);
  };

}
