import { Component, OnInit } from '@angular/core';
import { NgClass, NgForOf, CurrencyPipe, NgIf, JsonPipe } from '@angular/common';
import { DataService } from '../data-service.service';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [NgClass, NgForOf, CurrencyPipe, NgIf, JsonPipe],
  templateUrl: './team.component.html',
  styleUrl: './team.component.less'
})
export class TeamComponent implements OnInit {

  errorMessage: string = '';
  data: any;
  currentStats = {};

  maxNrWomenPerTeam = 2
  maxNrMenPerTeam = 4
  nrWomenPerTeam = 0
  nrMenPerTeam = 0
  money: number = 1500000;
  budget: number = 1500000;
  team: any[] = [];
  // historyTeams: any[] = this.getLSTeamHistory();
  sum: number = 0;

  constructor(private ds: DataService) { }

  ngOnInit(): void {
    this.ds.filteredAthletes.subscribe((data: any) => {
      this.data = data;
      this.team = this.data.filter((e: any) => e.selected);
      this.sum = this.team.reduce((acc, a) => acc + +a.value, 0);
      this.budget = this.money - this.sum;
      this.data.forEach((athlete: any) => {
        athlete.overBudget = athlete.value > this.budget;
      });
      this.error();
      
      const stats: any = { sum: 0 };
      this.ds.rounds.forEach((rn, i) => {
        stats[this.ds.roundsAliases[i]] = {
          points: this.team.reduce((acc: any, i: any) => acc + +i[rn], 0),
          price: this.team.reduce((acc: any, i: any) => acc + i.valorileVechi[rn], 0)
        }
        stats.sum += stats[this.ds.roundsAliases[i]].points;
      });

      this.currentStats = stats;
      this.nrWomenPerTeam = this.team.filter(e => e.gender === "Female").length;
      this.nrMenPerTeam = this.team.filter(e => e.gender === "Male").length;
    });
  }

  actionAthlete(a: any) {
    debugger;
    this.ds.actionAthlete(a);

    // window.localStorage.setItem("team", JSON.stringify(this.team));
  }

  error() {
    if (this.team.filter(e => e.gender == "Male").length > this.maxNrMenPerTeam) {
      this.errorMessage = "Too many men on the team";
    } else if (this.team.filter(e => e.gender == "Female").length > this.maxNrWomenPerTeam) {
      this.errorMessage = "Too many women on the team";
    } else if (
      this.team.filter(e => e.gender == "Female").length > this.maxNrWomenPerTeam &&
      this.team.filter(e => e.gender == "Male").length > this.maxNrMenPerTeam
    ) {
      this.errorMessage = "Too many people on the team";
    } else {
      this.errorMessage = ""
    }
  };

  clearTeam() {
    this.nrWomenPerTeam = 0;
    this.nrMenPerTeam = 0;
    this.team = [];
    this.currentStats = {};
    this.budget = 1500000;
    this.sum = 0;
    window.localStorage.removeItem("team");
    this.nrWomenPerTeam = 0;
    this.nrMenPerTeam = 0;
    this.data.forEach((e: any) => {
      e.selected = false;
      e.overBudget = e.value > this.budget;
    });

    this.data.forEach((e: any) => {
      e.selected = false;
      e.overBudget = e.value > this.budget;
    });
  };

  saveForLater() {
    const items = { ...localStorage };
    const keys = Object.keys(items).filter(e => { return e.indexOf("team") > -1 });
    if (!!keys.length) {
      const next = keys.length == 1 ? 1 : Math.max(...keys.filter(e => e.indexOf("/") > 0 - 1).map(e => +e.split("team/")[1])) + 1;
      const nextKey = `team/${next}`;
      window.localStorage.setItem(nextKey, JSON.stringify(this.team));
    } else {
      window.localStorage.setItem('team', JSON.stringify(this.team));
    }
    // this.historyTeams = this.getLSTeamHistory();
  };
}
