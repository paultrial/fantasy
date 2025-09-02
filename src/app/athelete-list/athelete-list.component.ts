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

  minweightedPointDelta!: any;
  maxweightedPointDelta!: any;
  minweightedPriceDelta!: any;
  maxweightedPriceDelta!: any;
  constructor(private ds: DataService) { }

  ngOnInit(): void {
    this.ds.filteredAthletes.subscribe(res => {
      this.filteredAthletes = res;
    });
    this.ds.sortKey.subscribe(res => { this.sortKey = res; });

    this.ds.minweightedPointDelta.subscribe((s:any) => this.minweightedPointDelta = s);
    this.ds.maxweightedPointDelta.subscribe((s:any) => this.maxweightedPointDelta = s);
    this.ds.minweightedPriceDelta.subscribe((s:any) => this.minweightedPriceDelta = s);
    this.ds.maxweightedPriceDelta.subscribe((s:any) => this.maxweightedPriceDelta = s);
  }

  valueToRedBlackColor(value: number): string {
    const clamped = Math.max(this.minweightedPriceDelta, Math.min(value, this.maxweightedPriceDelta));
    const normalized = (clamped - this.minweightedPriceDelta) / (this.maxweightedPriceDelta - this.minweightedPriceDelta);
    const red = Math.round(255 * (1 - normalized));
    return `rgb(${red}, 0, 0)`;
  };

  valueTogreenBlackColor(value: number): string {
    const clamped = Math.max(this.minweightedPointDelta, Math.min(value, this.maxweightedPointDelta));
    const normalized = (clamped - this.minweightedPointDelta) / (this.maxweightedPointDelta - this.minweightedPointDelta);
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
