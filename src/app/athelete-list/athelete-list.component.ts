import { Component } from '@angular/core';
import { NgIf, NgFor, NgClass, JsonPipe, CurrencyPipe, NgStyle } from '@angular/common';
import { DataService } from '../data-service.service';

@Component({
  selector: 'app-athelete-list',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, JsonPipe, CurrencyPipe, NgStyle],
  templateUrl: './athelete-list.component.html',
  styleUrl: './athelete-list.component.less'
})
export class AtheleteListComponent {
  sortKey: any;
  filteredAthletes: any[] = [];
  constructor(private ds: DataService) { }

  ngOnInit(): void {
    this.ds.filteredAthletes.subscribe(res => {
      this.filteredAthletes = res;
    });
    this.ds.sortKey.subscribe(res => {this.sortKey = res;});
  }

  valueToRedBlackColor(value: number): string {
    debugger
    const clamped = Math.max(this.ds.minweightedPriceDelta, Math.min(value, this.ds.maxweightedPriceDelta));
    const normalized = (clamped - this.ds.minweightedPriceDelta) / (this.ds.maxweightedPriceDelta - this.ds.minweightedPriceDelta);
    const red = Math.round(255 * (1 - normalized));
    return `rgb(${red}, 0, 0)`;
  };
  
  valueTogreenBlackColor(value: number): string {
    debugger
    const clamped = Math.max(this.ds.minweightedPointDelta, Math.min(value, this.ds.maxweightedPointDelta));
    const normalized = (clamped - this.ds.minweightedPointDelta) / (this.ds.maxweightedPointDelta - this.ds.minweightedPointDelta);
    const green = Math.round(255 * normalized);
    return `rgb(0, ${green}, 0)`;
  };

  sortBy(key: string) {
    this.ds.sortBy(key);
  }

  actionAthlete(a: any): void {
    this.ds.actionAthlete(a);    
  };
}
