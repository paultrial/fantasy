import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { DataService } from './data-service.service';
import { NgIf, NgFor, NgClass, JsonPipe, CurrencyPipe, NgStyle, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-fantasy',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, FormsModule, JsonPipe, CurrencyPipe, NgStyle, AsyncPipe],
  templateUrl: './fantasy.component.html',
  styleUrl: './fantasy.component.less'
})
export class FantasyComponent implements OnInit {
  maxPointsPossible = 0;
  bt: Observable<any> = of();
  title = 'P.B. Fantasy DH';
  data: any;
  team: any[] = [];
  countrylist: any[] = [];
  progressionScores: number[] = [];
  sum: number = 0;
  totalPointsfilter = {
    min: undefined,
    max: undefined
  }

  priceFilter = {
    min: undefined,
    max: undefined
  }

  weightedPriceDeltaFilter = {
    min: undefined,
    max: undefined
  }

  weightedPointDeltaFilter = {
    min: undefined,
    max: undefined
  }

  minweightedPointDelta!: number;
  maxweightedPointDelta!: number;
  minweightedPriceDelta!: number;
  maxweightedPriceDelta!: number;

  injuryfilter: boolean | undefined;
  nameFilter = '';

  sortKey = {
    key: 'value',
    direction: 'rw'
  }
  errorMessage: string = '';

  currentStats = {};

  maxNrWomenPerTeam = 2
  maxNrMenPerTeam = 4
  nrWomenPerTeam = 0
  nrMenPerTeam = 0
  localStorageTeam = undefined;
  money: number = 1500000;
  budget: number = 1500000;
  weights = <any>[];
  filterGender = '';
  countryFilter = '';
  filteredAthletes: any[] = [];
  historyTeams: any[] = [];
  bestTeams: any = [];
  prevTeam: any = {};
  nor = 11; // number of rounds in the season

  roundFilters: { [key: string]: { min?: number; max?: number } } = {};
  rounds = Array.from({ length: this.nor }, (_, i) => `round${i + 1}`);
  roundsAliases = [
    "Bielsko-Biala WC #1",
    "Loudenvielle WC #2",
    "Leogang WC #3",
    "Val di Sole WC #4",
    "La Thuile WC #5",
    "Andorra WC #6",
    "Les Gets WC #7",
    "2025 World Championships Champery",
    "Lenzerheide WC #8",
    "Lake Placid WC #9",
    "Mont-Sainte-Anne WC #1",
  ];
  roundsConditions = [
    "Wet",
    "Dry",
    "Dry",
    "Dry",
    "Dry",
    "Dry",
    "Wet",
    "Dry",
    "Dry",
    "Dry",
    "Dry"
  ]

  predictNextRoundTeamsMinPioints = 120;

  constructor(private dataService: DataService, private route: ActivatedRoute) {
    // for (let rn = 1; rn <= 5; rn++) { this.rounds.push("round" + rn.toString()) }
    for (let i = 1; i < 12; i++) { this.weights.push(i / this.nor); }
    this.rounds.forEach(r => {
      this.roundFilters[r] = {
        min: undefined,
        max: undefined
      }
    })
  }

  ngOnInit(): void {
    const dataFile = this.route.snapshot.data['dataFile'] || 'assets/PBathletes.json';
    this.dataService.getData(dataFile).subscribe((res) => {
      this.data = Object.keys(res).map(i => {
        const athlete = res[i];
        athlete.value = +athlete.value;
        athlete.prices = [];
        athlete.injury = !!athlete.injury;
        const values = athlete.roundValues.replace(/,/g, "").split(";");
        const valorileVechi = {} as any;
        values.forEach((e: any, i: number) => { 
          valorileVechi['round' + i.toString()] = +values[i].split(":")[1];
          athlete.prices.push(+values[i].split(":")[1]);
        });
        athlete["valorileVechi"] = valorileVechi;
        athlete.selected = false;
        athlete.totalpoints = +athlete.totalpoints;
        athlete.points = [];

        athlete.roundsPoints = this.rounds.map((r, i) => {
          const ob: any = {};
          ob[this.roundsAliases[i]] = athlete[r];
          athlete.points.push(athlete[r])
          return ob;
        });

        athlete.gender = +athlete.gender == 1 ? 'Male' : 'Female';
        athlete.progressionScore = this.computeProgressionScore(athlete);
        athlete.pricePerPoint = athlete.totalpoints > 0 ? (athlete.value / +athlete.totalpoints).toFixed(2) : 0;
        return athlete;
      });

      const localStorageBestTeams = window.localStorage.getItem("bestTeams");

      if (!localStorageBestTeams) {
        let start = performance.now();
        this.bestTeams = this.findBestTeamsOptimized(this.data, this.money, this.nor, 36);
        window.localStorage.setItem('bestTeams', JSON.stringify(this.bestTeams));
        this.maxPointsPossible = this.bestTeams.map((e: any) => e.bestPoints).reduce((accumulator: any, currentValue: any) => accumulator + currentValue, 0);

        let end = performance.now();
        alert(`Best teams calculated in ${(end - start).toFixed(2)} ms. Found ${this.bestTeams.length} best teams.`);
      } else {
        this.bestTeams = JSON.parse(localStorageBestTeams);
        this.maxPointsPossible = this.bestTeams.map((e: any) => e.bestPoints).reduce((accumulator: any, currentValue: any) => accumulator + currentValue, 0);
      }

      this.lst();
      this.sort();
      this.countrylist = this.createCountryList();
    });
  }

  sortBy(key: string) {
    if (this.sortKey.key !== key) {
      this.sortKey.key = key;
      this.sortKey.direction = "rw";
    }
    this.sortKey.direction = this.sortKey.direction === "fw" ? "rw" : "fw";
    this.sort();
  }

  sort() {
    this.filteredAthletes.sort((a: any, b: any) => {
      const x = this.sortKey.direction == "fw" ? a[this.sortKey.key] - b[this.sortKey.key] : b[this.sortKey.key] - a[this.sortKey.key];
      return x;
    });

  };

  actionAthlete(a: any): void {
    this.data.forEach((athlete: any) => {
      if (a.id == athlete.id) {
        athlete.selected = !athlete.selected;
      }
    });
    this.team = this.data.filter((e: any) => e.selected);
    this.sum = this.team.reduce((acc, a) => acc + +a.value, 0);
    this.budget = this.money - this.sum;
    this.data.forEach((athlete: any) => {
      athlete.overBudget = athlete.value > this.budget;
    });
    this.error();

    const stats: any = { sum: 0 };
    this.rounds.forEach((rn, i) => {
      stats[this.roundsAliases[i]] = {
        points: this.team.reduce((acc: any, i: any) => acc + +i[rn], 0),
        price: this.team.reduce((acc: any, i: any) => acc + i.valorileVechi[rn], 0)
      }
      stats.sum += stats[this.roundsAliases[i]].points;
    });

    this.currentStats = stats;
    this.nrWomenPerTeam = this.team.filter(e => e.gender === "Female").length;
    this.nrMenPerTeam = this.team.filter(e => e.gender === "Male").length;
    window.localStorage.setItem("team", JSON.stringify(this.team));
  };

  applyFilters(): void {
    this.filteredAthletes = this.data.filter((athlete: any) => {
      const nameMatch = !this.nameFilter || (
        athlete.firstname?.toLowerCase().includes(this.nameFilter.toLowerCase()) ||
        athlete.lastname?.toLowerCase().includes(this.nameFilter.toLowerCase())
      );

      const genderMatch = !this.filterGender || athlete.gender === this.filterGender;
      const roundsMatch = this.rounds.every(round => {
        const filter = this.roundFilters[round];
        const value = (athlete as any)[round] || 0;
        return (!filter?.min || value >= filter.min);
      });

      const priceFilterMatch = (!this.priceFilter?.min || athlete.value >= this.priceFilter.min) && (!this.priceFilter?.max || athlete.value <= this.priceFilter.max);

      const totalPointsfilterMatch = (!this.totalPointsfilter?.min || athlete.totalpoints >= this.totalPointsfilter.min) && (!this.totalPointsfilter?.max || athlete.totalpoints <= this.totalPointsfilter.max);
      const weightedPointDeltaFilterMatch = (!this.weightedPointDeltaFilter?.min || athlete.progressionScore.weightedPointDelta >= this.weightedPointDeltaFilter.min) && (!this.weightedPointDeltaFilter?.max || athlete.progressionScore.weightedPointDelta <= this.weightedPointDeltaFilter.max);
      const weightedPriceDeltaFilterMatch = (!this.weightedPriceDeltaFilter?.min || athlete.progressionScore.weightedPriceDelta >= this.weightedPriceDeltaFilter.min) && (!this.weightedPriceDeltaFilter?.max || athlete.progressionScore.weightedPriceDelta <= this.weightedPriceDeltaFilter.max);
      const injuryFilterMatch = this.injuryfilter !== athlete.injury;

      const countryMatch = !this.countryFilter || athlete.country === this.countryFilter;
      return genderMatch &&
        roundsMatch &&
        totalPointsfilterMatch &&
        priceFilterMatch &&
        injuryFilterMatch &&
        weightedPointDeltaFilterMatch &&
        weightedPriceDeltaFilterMatch &&
        nameMatch &&
        countryMatch;
    });

    this.sort();
  }

  resetFilters(): void {
    this.priceFilter = {
      min: undefined,
      max: undefined
    };
    this.totalPointsfilter = {
      min: undefined,
      max: undefined
    };
    this.filterGender = '';
    this.filteredAthletes = [...this.data];
    this.rounds.forEach(r => {
      this.roundFilters[r] = {
        min: undefined,
        max: undefined
      }
    });

    this.weightedPointDeltaFilter = {
      min: undefined,
      max: undefined
    }
    this.weightedPriceDeltaFilter = {
      min: undefined,
      max: undefined
    }

    this.injuryfilter = undefined;
    this.nameFilter = '';
    this.countryFilter = '';
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
    this.filteredAthletes.forEach((e: any) => {
      e.selected = false;
      e.overBudget = e.value > this.budget;
    });
  };

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
    this.historyTeams = this.getLSTeamHistory();
  };

  deleteOneFromHistory(number: number) {
    const key = `team/${number}`;
    localStorage.removeItem(key);
    const index = this.historyTeams.map(e => e.number).indexOf(number);
    this.historyTeams.splice(index, 1)
  };

  loadFromHistory(number: number) {
    const key = `team/${number}`;
    const team = JSON.parse(localStorage.getItem(key) as string);

    if (this.team.length > 0) {
      this.saveForLater();
    }

    this.team = team;
    this.sum = this.team.reduce((acc, a) => acc + +a.value, 0);
    this.budget = this.money - this.sum;

    // this.deleteOneFromHistory(number);
  };

  getLSTeamHistory() {
    const response: any[] = [];
    const h: any = {};
    const items = { ...localStorage };
    const keys = Object.keys(items).filter(e => { return e.indexOf("team/") > -1 });
    keys.map(e => e.split("/")[1]).forEach((nr, i) => {
      h[nr] = JSON.parse(items[`team/${nr}`]);
    });
    Object.keys(h).forEach(numeleDinNumar => {
      response.push({
        number: numeleDinNumar,
        data: h[numeleDinNumar],
        sum: h[numeleDinNumar].reduce((acc: any, a: any) => acc + +a.value, 0)
      });
    });

    response.forEach(ht => {
      const stats: any = { sum: 0 };
      this.rounds.forEach((rn, i) => {
        stats[this.roundsAliases[i]] = {
          points: ht.data.reduce((acc: any, i: any) => acc + +i[rn], 0),
          price: ht.data.reduce((acc: any, i: any) => acc + i.valorileVechi[rn], 0)
        }
        stats.sum += stats[this.roundsAliases[i]].points;
      });
      ht.stats = stats;
    });

    return response;
  };

  clearHistory() {
    const items = { ...localStorage };
    const keys = Object.keys(items).filter(e => { return e.indexOf("team/") > -1 });
    // alert("nu prea face ceva butonul asta")
    this.historyTeams = [];
  };

  valueToRedBlackColor(value: number): string {
    const clamped = Math.max(this.minweightedPriceDelta, Math.min(value, this.maxweightedPriceDelta));
    const normalized = (clamped - this.minweightedPriceDelta) / (this.maxweightedPriceDelta - this.minweightedPriceDelta);
    const red = Math.round(220 * (1 - normalized));
    return `rgb(${red}, 0, 0)`;
  };

  valueTogreenBlackColor(value: number): string {
    const clamped = Math.max(this.minweightedPointDelta, Math.min(value, this.maxweightedPointDelta));
    const normalized = (clamped - this.minweightedPointDelta) / (this.maxweightedPointDelta - this.minweightedPointDelta);
    const green = Math.round(255 * normalized);
    return `rgb(0, ${green}, 0)`;
  };

  lst() {
    const localStorageTeam = JSON.parse(window.localStorage.getItem("team") as string);

    if (!!localStorageTeam) {
      localStorageTeam.forEach((athlete: any) => {
        const id = this.data.map((e: any) => e.id).indexOf(athlete.id)
        this.data[id].selected = true;
      });
      this.team = this.data.filter((e: any) => e.selected);

      this.sum = this.team.reduce((acc, a) => acc + +a.value, 0);
      this.budget = this.money - this.sum;

      const stats: any = { sum: 0 };
      this.rounds.forEach((rn, i) => {
        stats[this.roundsAliases[i]] = {
          points: this.team.reduce((acc: any, i: any) => acc + +i[rn], 0),
          price: this.team.reduce((acc: any, i: any) => acc + i.valorileVechi[rn], 0)
        }
        stats.sum += stats[this.roundsAliases[i]].points;
      });

      this.nrWomenPerTeam = this.team.filter(e => e.gender === "Female").length;
      this.nrMenPerTeam = this.team.filter(e => e.gender === "Male").length;

      this.currentStats = stats;
    }

    this.historyTeams = this.getLSTeamHistory();

    this.progressionScores = this.data.map((a: any) => a.progressionScore).sort((a: any, b: any) => { a.weightedPointDelta - b.weightedPointDelta });

    this.minweightedPointDelta = Math.min(...this.progressionScores.map((e: any) => +e.weightedPointDelta) as any);
    this.maxweightedPointDelta = Math.max(...this.progressionScores.map((e: any) => +e.weightedPointDelta) as any);
    this.minweightedPriceDelta = Math.min(...this.progressionScores.map((e: any) => +e.weightedPriceDelta) as any);
    this.maxweightedPriceDelta = Math.max(...this.progressionScores.map((e: any) => +e.weightedPriceDelta) as any);

    this.getInstagramData();
    this.applyFilters();
  };

  isAthleteInList(athleteNames: string[], firstName: string, lastName: string): boolean {
    const an = athleteNames.map(name => {
      const firstname = name.split(" ")[1].toLowerCase();
      const lastname = name.split(" ")[0].toLowerCase();
      return { firstname, lastname };
    });

    const matchingIndexes = an
      .map((athlete, index) => (athlete.firstname.toLowerCase() === firstName.toLowerCase() && athlete.lastname.toLowerCase() === lastName.toLowerCase()) ? index : -1)
      .filter(index => index !== -1);

    return matchingIndexes.length > 0;
  };

  getInstagramData() {
    this.dataService.getinstagramData().subscribe((res) => {
      const instas = res.downhill_athletes;
      this.data.forEach((athlete: any) => {
        const insta = instas.find((e: any) => e.name === athlete.firstname + " " + athlete.lastname);
        if (insta) {
          athlete.instagram = insta.instagram_handle;
        }
      });
    }, error => {
      console.error('Error fetching Instagram data:', error);
    });
  };

  createCountryList() {
    const countries = this.data.map((e: any) => e.country).filter((e: any, i: number, a: any) => a.indexOf(e) === i).sort();
    const cunt = this.data.map((e: any) => { return { contryCode: e.country, countryName: e.countryname } });
    const c = countries.map((e: any) => {
      return {
        contryCode: e,
        countryName: cunt.filter((s: any) => s.contryCode === e)[0].countryName,
        athletes: 0,
        points: 0
      }
    });
    this.data.forEach((a: any) => {
      const index = c.map((e: any) => e.contryCode).indexOf(a.country);
      c[index].athletes += 1;
      c[index].points += a.totalpoints;
    });
    return c.sort((a: any, b: any) => b.points - a.points);
  };

  getCombinations(arr: any[], k: number): any[][] {
    if (k === 0) return [[]];
    if (arr.length === 0) return [];
    const [first, ...rest] = arr;
    const withFirst = this.getCombinations(rest, k - 1).map(c => [first, ...c]);
    const withoutFirst = this.getCombinations(rest, k);
    return [...withFirst, ...withoutFirst];
  }


  // find best teams

  findBestTeamsOptimized(athletes: any[], budget = 1500000, roundsPlayed = this.nor, shortlistSize: number) {
    const males = athletes.filter(a => a.gender === "Male");
    const females = athletes.filter(a => a.gender === "Female");

    function getPointsUpToRound(athlete: any, round: number) {
      return +athlete[`round${round}`];
    }

    function getValueAtRound(athlete: any, round: number) {
      return athlete.valorileVechi[`round${round - 1}`] || athlete.value;
    }

    function scoreAthlete(athlete: any, round: number) {
      const value = getValueAtRound(athlete, round);
      const points = getPointsUpToRound(athlete, round);
      return {
        ...athlete,
        roundValue: value,
        roundPoints: points,
        efficiency: points / value
      };
    }

    function getCombinations(arr: any[], k: number): any[][] {
      if (k === 0) return [[]];
      if (arr.length === 0) return [];
      const [first, ...rest] = arr;
      const withFirst = getCombinations(rest, k - 1).map(c => [first, ...c]);
      const withoutFirst = getCombinations(rest, k);
      return [...withFirst, ...withoutFirst];
    }
    const results = [];

    for (let round = 1; round <= roundsPlayed; round++) {
      // Score athletes for this round
      const scoredMales = males.map(a => scoreAthlete(a, round)).sort((a, b) => b.efficiency - a.efficiency).slice(0, shortlistSize);
      const scoredFemales = females.map(a => scoreAthlete(a, round)).sort((a, b) => b.efficiency - a.efficiency).slice(0, shortlistSize);

      let bestTeam = null;
      let bestPoints = -1;

      const maleCombos = getCombinations(scoredMales, 4);
      const femaleCombos = getCombinations(scoredFemales, 2);
      // debugger

      for (const m of maleCombos) {
        for (const f of femaleCombos) {
          const team = [...m, ...f];
          const totalValue = team.reduce((sum, a) => sum + a.roundValue, 0);
          if (totalValue > budget) continue;

          const totalPoints = team.reduce((sum, a) => sum + a.roundPoints, 0);
          const roundname = this.roundsAliases[round - 1];

          if (totalPoints > bestPoints) {
            bestPoints = totalPoints;

            team.forEach((athlete: any) => {
              athlete.thenValue = getValueAtRound(athlete, round);
              athlete.thenPoints = getPointsUpToRound(athlete, round);
            });
            bestTeam = { team, bestPoints, totalValue, roundname };
          }
        }
      }

      results.push(bestTeam);
    };

    const count: any = {

    }

    results.forEach((bt: any) => {
      bt.team.forEach((athlete: any) => {
        if (!count[athlete.id]) {
          count[athlete.id] = { athlete, appearances: 0, totalPoints: 0, totalValue: 0 };
          athlete.appearances = count[athlete.id].appearances;
        }
        count[athlete.id].appearances += 1;
        athlete.appearances = count[athlete.id].appearances;
      });
    });
    // debugger
    return results;
  }


  predictNextRoundTeams() {
    const athletes = this.data, budget = 1500000, shortlistSize = 25, lookback = 7;
    const males = athletes.filter((a: any) => a.gender === "Male");
    const females = athletes.filter((a: any) => a.gender === "Female");

    function getRecentAveragePoints(athlete: any, lookback: number) {
      const points = [];
      for (let r = 16; r >= 1; r--) {
        const val = Number(athlete[`round${r}`] || 0);
        if (val > 0) points.push(val);
        if (points.length >= lookback) break;
      }
      if (points.length === 0) return 0;
      return points.reduce((a, b) => a + b, 0) / points.length;
    }

    function predictAthlete(athlete: any) {
      const avg = getRecentAveragePoints(athlete, lookback);
      const trend = Number(athlete.progressionScore?.weightedPointDelta || 0);
      const expectedPoints = avg + 0.5 * trend; // weighting factor
      return {
        ...athlete,
        nextPoints: expectedPoints,
        nextValue: athlete.value,
        efficiency: expectedPoints / athlete.value
      };
    }

    const scoredMales = males.map(predictAthlete).sort((a: any, b: any) => b.efficiency - a.efficiency).slice(0, shortlistSize);
    const scoredFemales = females.map(predictAthlete).sort((a: any, b: any) => b.efficiency - a.efficiency).slice(0, shortlistSize);

    let bestTeam = null;
    let bestPoints = -1;

    const maleCombos = this.getCombinations(scoredMales, 4);
    const femaleCombos = this.getCombinations(scoredFemales, 2);

    for (const m of maleCombos) {
      for (const f of femaleCombos) {
        const team = [...m, ...f];
        const totalValue = team.reduce((sum, a) => sum + a.nextValue, 0);
        if (totalValue > budget) continue;

        const totalPoints = team.reduce((sum, a) => sum + a.nextPoints, 0);

        if (totalPoints > bestPoints) {
          bestPoints = totalPoints;
          bestTeam = { team, predictedPoints: totalPoints.toFixed(), totalValue: totalValue.toFixed() };
        }
      }
    }
    this.bt = of(bestTeam);
  }

  // weather can be "Wet" or "Dry"
  public predictNextRoundTeam() {

    const athletes = this.data as any[],
      budget = 1_500_000,
      shortlistSize = 25,
      lookback = 8
    const roundsMeta = this.roundsConditions;

    const males = athletes.filter(a => a.gender === 'Male');
    const females = athletes.filter(a => a.gender === 'Female');

    function getCombinations(arr: any[], k: number): any[][] {
      if (k === 0) return [[]];
      if (arr.length === 0) return [];
      const [first, ...rest] = arr;
      const withFirst = getCombinations(rest, k - 1).map(c => [first, ...c]);
      const withoutFirst = getCombinations(rest, k);
      return [...withFirst, ...withoutFirst];
    }

    // Compute average performance by weather
    const getWeatherPerformance = (athlete: any, weather: string): number => {
      const scores: number[] = [];
      for (let i = 0; i <= this.roundsConditions.length; i++) {

        const pts = Number(athlete[`round${i + 1}`] || 0);
        if (pts > 0) scores.push(pts);
      }
      if (scores.length === 0) return 0; // no data
      return scores.reduce((a, b) => a + b, 0) / scores.length;
    };

    const getRecentAveragePoints = (athlete: any, lookback: number): number => {
      const points: number[] = [];
      for (let r = 16; r >= 1; r--) {
        const val = Number(athlete[`round${r}`] || 0);
        if (val > 0) points.push(val);
        if (points.length >= lookback) break;
      }
      if (points.length === 0) return 0;
      return points.reduce((a, b) => a + b, 0) / points.length;
    };

    const predictAthlete = (athlete: any) => {
      const avgRecent = getRecentAveragePoints(athlete, lookback);
      const trend = Number(athlete.progressionScore?.weightedPointDelta || 0);
      const basePoints = avgRecent + 0.5 * trend;

      const weatherAvg = getWeatherPerformance(athlete, "Dry");
      const adjustedPoints = weatherAvg > 0
        ? (basePoints * 0.7 + weatherAvg * 0.3) // blend recent + weather history
        : basePoints; // fallback if no weather data

      return {
        ...athlete,
        roundValue: athlete.value,
        roundPoints: adjustedPoints,
        efficiency: adjustedPoints / athlete.value
      };
    };

    const scoredMales = males.map(predictAthlete).sort((a, b) => b.efficiency - a.efficiency).slice(0, shortlistSize);
    const scoredFemales = females.map(predictAthlete).sort((a, b) => b.efficiency - a.efficiency).slice(0, shortlistSize);

    let bestTeam = null;
    let bestPoints = -1;

    const maleCombos = getCombinations(scoredMales, 4);
    const femaleCombos = getCombinations(scoredFemales, 2);

    for (const m of maleCombos) {
      for (const f of femaleCombos) {
        const team = [...m, ...f];
        const totalValue = team.reduce((sum, a) => sum + a.roundValue, 0);
        if (totalValue > budget) continue;

        const totalPoints = team.reduce((sum, a) => sum + a.roundPoints, 0);

        if (totalPoints > bestPoints) {
          bestPoints = totalPoints;
          bestTeam = { team, predictedPoints: totalPoints, totalValue };
        }
      }
    }

    return bestTeam;
  }

  findHighScoringTeam(points: number) {
    const athletes = this.data as any[],
      budget = 1500000
    // Filter eligible athletes
    const males = athletes.filter(a => a.gender === 'Male' && a.totalpoints >= points);
    const females = athletes.filter(a => a.gender === 'Female' && a.totalpoints >= points);

    let bestTeam = null;
    let bestPoints = -1;

    const maleCombos = this.getCombinations(males, 4);
    const femaleCombos = this.getCombinations(females, 2);

    for (const m of maleCombos) {
      for (const f of femaleCombos) {
        const team = [...m, ...f];
        const totalValue = team.reduce((sum, a) => sum + a.value, 0);
        if (totalValue > budget) continue; // skip if over budget

        const totalPoints = team.reduce((sum, a) => sum + a.totalpoints, 0);

        if (totalPoints > bestPoints) {
          bestPoints = totalPoints;
          bestTeam = { team, predictedPoints: totalPoints, totalValue };
        }
      }
    }
    this.bt = of(bestTeam);
    return bestTeam;
  }

  barHeightCalcperPoints(points: number): string{
    const str: string = `${points*100/30}%`;
    return str;
  }

  barHeightCalcperPrice(price: number): string{
    const str: string = `${price*100/750000}%`;
    return str;
  }
}
