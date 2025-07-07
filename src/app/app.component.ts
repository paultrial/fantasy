import { Component, OnInit, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DataService } from './data-service.service';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgIf, NgFor, NgClass, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.less'
})
export class AppComponent implements OnInit {
  title = 'fantasy';
  data: any;
  team: any[] = [];
  sum: number = 0;
  totalPointsfilter = {
    min: undefined,
    max: undefined
  }

  sortKey = ""
  errorMessage: string = '';

  maxNrWomenPerTeam = 2
  maxNrMenPerTeam = 4

  money: number = 1500000;
  budget: number = 1500000;
  weights = <any>[];
  filterGender = '';
  filteredAthletes: any[] = [];

  roundFilters: { [key: string]: { min?: number; max?: number } } = {};
  rounds = Array.from({ length: 5 }, (_, i) => `round${i + 1}`);

  constructor(private dataService: DataService) {
    // for (let rn = 1; rn <= 5; rn++) { this.rounds.push("round" + rn.toString()) }
    for (let i = 1; i < 12; i++) { this.weights.push(i / 10); }
    this.rounds.forEach(r => {
      this.roundFilters[r] = {
        min: undefined,
        max: undefined
      }
    })
  }

  ngOnInit(): void {
    this.dataService.getData().subscribe((res) => {
      this.data = Object.keys(res).map(i => {
        const athlete = res[i];
        athlete.value = +athlete.value;
        athlete.injury = !!athlete.injury;
        const values = athlete.roundValues.replace(/,/g, "").split(";");
        const valorileVechi = {} as any;
        values.forEach((e: any, i: number) => { valorileVechi['round' + i.toString()] = +values[i].split(":")[1] });
        athlete["valorileVechi"] = valorileVechi;
        athlete.selected = false;
        athlete.totalpoints = +athlete.totalpoints;
        athlete.gender = +athlete.gender == 1 ? 'Male' : 'Female';
        athlete.progressionScore = this.computeProgressionScore(athlete);
        athlete.pricePerPoint = athlete.totalpoints > 0 ? (athlete.value / +athlete.totalpoints).toFixed(2) : 0
        return athlete;
      }).filter(a => !a.injury).sort((a, b) => +b.value - +a.value);

      const localStorageTeam = JSON.parse(window.localStorage.getItem("team") as string);
      localStorageTeam.forEach((athlete: any) => {
        const id = this.data.map((e: any) => e.id).indexOf(athlete.id)
        this.data[id].selected = true;
      });
      this.team = this.data.filter((e: any) => e.selected);

      this.sum = this.team.reduce((acc, a) => acc + +a.value, 0);
      this.budget = this.money - this.sum;
    });
  }

  sortBy() {
    const key = this.sortKey.split('/')[0]
    const direction = this.sortKey.split('/')[1]
    this.filteredAthletes.sort((a: any, b: any) => {
      const x = direction == "fw" ? a[key] - b[key] : b[key] - a[key];
      return x;
    })
    this.data.sort((a: any, b: any) => {
      const x = direction == "fw" ? a[key] - b[key] : b[key] - a[key];
      return x;
    })
  }

  selectAthlete(a: any): void {
    this.data.forEach((athlete: any) => {
      if (a.id == athlete.id) {
        athlete.selected = true;
      }
    });
    this.team = this.data.filter((e: any) => e.selected);
    this.sum = this.team.reduce((acc, a) => acc + +a.value, 0);
    this.budget = this.money - this.sum;
    this.data.forEach((athlete: any) => {
      athlete.overBudget = athlete.value > this.budget;
    });
    this.error();

    window.localStorage.setItem("team", JSON.stringify(this.team));
  };

  deselectAthlete(a: any): void {
    this.data.forEach((athlete: any) => {
      if (a.id == athlete.id) {
        athlete.selected = false;
      }
    });
    this.team = this.data.filter((e: any) => e.selected);
    this.sum = this.team.reduce((acc, a) => acc + +a.value, 0);
    this.budget = this.money - this.sum;

    this.data.forEach((athlete: any) => {
      athlete.overBudget = athlete.value > this.budget;
    });
    this.error();

    window.localStorage.removeItem("team");
    window.localStorage.setItem("team", JSON.stringify(this.team));
  };

  applyFilters(): void {
    this.filteredAthletes = this.data.filter((athlete: any) => {
      const genderMatch =
        !this.filterGender || athlete.gender === this.filterGender;

      const roundsMatch = this.rounds.every(round => {
        const filter = this.roundFilters[round];
        const value = (athlete as any)[round] || 0;
        return (!filter?.min || value >= filter.min);
      });

      const totalPointsfilterMatch = (!this.totalPointsfilter?.min || athlete.totalpoints >= this.totalPointsfilter.min) && (!this.totalPointsfilter?.max || athlete.totalpoints <= this.totalPointsfilter.max);

      return genderMatch && roundsMatch && totalPointsfilterMatch;
    });
    this.sortBy();
  }

  resetFilters(): void {
    this.totalPointsfilter = {
      min: undefined,
      max: undefined
    }
    this.filterGender = '';
    this.filteredAthletes = [...this.data];
    this.rounds.forEach(r => {
      this.roundFilters[r] = {
        min: undefined,
        max: undefined
      }
    })
  };

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
  }

  clearTeam() {
    this.data.forEach((e: any) => {
      e.selected = false;
    });
    this.team = [];
    window.localStorage.removeItem("team");
  }

  computeProgressionScore = (athlete: any) => {
    const allrounds = []
    for (let rn = 1; rn <= 4; rn++) { allrounds.push("round" + rn.toString()) }

    const priceDeltas = [];
    const pointDeltas = [];
    const aPrices = athlete.roundValues.replace(/,/g, "").split(";").map((e: any) => +e.split(":")[1]);
    const aPoints = allrounds.map(r => +athlete[r])

    for (let i = 1; i < aPrices.length; i++) {
      if (aPrices[i] > 0) {
        priceDeltas.push(aPrices[i] - aPrices[i - 1]);
      }
    }
    for (let i = 1; i < aPoints.length; i++) {
      pointDeltas.push(aPoints[i] - aPoints[i - 1]);
    }
    const weightedPriceDelta = priceDeltas.reduce((acc, delta, i) => acc + (delta * this.weights[i]), 0).toFixed(2);
    const weightedPointDelta = pointDeltas.reduce((acc, delta, i) => acc + (delta * this.weights[i]), 0).toFixed(2);

    return {
      weightedPriceDelta,
      weightedPointDelta
    };
  }


}

/*
athletes = athletes.filter(athlete => {
  const injury = !!athlete.injury;
  const every = rounds.every(r => +athlete[r] >= mp);
  return every && !injury
});

athletes.forEach(athlete => {
  athlete.progressionScore = computeProgressionScore(athlete);
});

const men = athletes.filter(athlete => {
  return +athlete.gender == 1; 6
});

const women = athletes.filter(athlete => {
  return +athlete.gender == 2;
});

const f2w = women.slice(0, 2);
const f4m = men.slice(0, 4);
const sum = men.slice(0, 4).reduce((acc, a) => acc + +a.value, 0) + women.slice(0, 2).reduce((acc, a) => acc + +a.value, 0);
const team = [].concat(f2w, f4m);

team.forEach(athlete => {
  
});

const stats = {};
rounds.forEach(rn => {
  stats[rn] = {
    points: team.reduce((acc, i) => acc + +i[rn], 0),
    price: team.reduce((acc, i) => acc + i.valorileVechi[rn], 0)
  }
});

women.forEach(athlete => { console.log(`${athlete.firstname} ${athlete.lastname} ${athlete.progressionScore.weightedPriceDelta} ${athlete.progressionScore.weightedPointDelta}`) });

debugger;
}
*/
