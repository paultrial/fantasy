import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import Fuse from 'fuse.js';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private jsonUrl = 'assets/PBathletes.json';

  data: any;
  
  countrylist = new BehaviorSubject<any[]>([]);
  progressionScores: number[] = [];
  
  totalPointsfilter = {
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

  minweightedPointDelta: any = new BehaviorSubject(null);
  maxweightedPointDelta: any = new BehaviorSubject(null);
  minweightedPriceDelta: any = new BehaviorSubject(null);
  maxweightedPriceDelta: any = new BehaviorSubject(null);

  injuryfilter = new BehaviorSubject<boolean | undefined>(undefined);
  nameFilter = new BehaviorSubject<string>('');
  filterGender = new BehaviorSubject<string>('');
  countryFilter = new BehaviorSubject<string>('');

  localStorageTeam = undefined;

  historyTeams: any[] = [];
  prevTeam: any = {};

  sortKey = new BehaviorSubject<any>({
    key: 'value',
    direction: 'rw'
  });

  public roundsAliases = [
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

  filteredAthletes = new BehaviorSubject<any[]>(<any[]>[]);
  weights = <any>[];
  rounds = Array.from({ length: 7 }, (_, i) => `round${i + 1}`);

  roundFilters: { [key: string]: { min?: number; max?: number } } = {};

  constructor(private http: HttpClient) {
    for (let i = 1; i < 12; i++) { this.weights.push(i / 10); }
    this.rounds.forEach(r => {
      this.roundFilters[r] = {
        min: undefined,
        max: undefined
      }
    })
    this.getData().subscribe(res => {

      const d = Object.keys(res).map(i => {
        const athlete = res[i];
        athlete.value = +athlete.value;
        athlete.injury = !!athlete.injury;
        const values = athlete.roundValues.replace(/,/g, "").split(";");
        const valorileVechi = {} as any;
        values.forEach((e: any, i: number) => { valorileVechi['round' + i.toString()] = +values[i].split(":")[1] });
        athlete["valorileVechi"] = valorileVechi;
        athlete.selected = false;
        athlete.totalpoints = +athlete.totalpoints;

        athlete.roundsPoints = this.rounds.map((r, i) => {
          const ob: any = {};
          ob[this.roundsAliases[i]] = athlete[r];
          return ob;
        })

        athlete.gender = +athlete.gender == 1 ? 'Male' : 'Female';
        athlete.progressionScore = this.computeProgressionScore(athlete);
        athlete.pricePerPoint = athlete.totalpoints > 0 ? (athlete.value / +athlete.totalpoints).toFixed(2) : 0;

        // const qualiNames = qualiRes.map((e: any) => e.columns[1].toLowerCase());
        // athlete.inQuali = !this.isAthleteInList(qualiNames, athlete.firstname, athlete.lastname);
        return athlete;
      });


      this.data = d;

      this.filteredAthletes.next([...this.data]);
      this.lst();
      this.sort();
      this.countrylist.next(this.createCountryList());
    })
  }

  sort() {
    const coaie = this.sortKey.getValue();
    let pula = this.filteredAthletes.getValue();

    pula = pula.sort((a: any, b: any) => {
      const x = coaie.direction == "fw" ? a[coaie.key] - b[coaie.key] : b[coaie.key] - a[coaie.key];
      return x;
    });
    this.filteredAthletes.next(pula);
  };

  sortBy(key: string) {
    const coaie = this.sortKey.getValue();
    if (coaie.key !== key) {
      coaie.key = key;
      coaie.direction = "rw";
    }
    coaie.direction = coaie.direction === "fw" ? "rw" : "fw";
    this.sort();
  }


  applyFilters(input:any): void {
    const fa = this.data.filter((athlete: any) => {
      const nameMatch = !input.nameFilter || (
        athlete.firstname?.toLowerCase().includes(input.nameFilter.toLowerCase()) ||
        athlete.lastname?.toLowerCase().includes(input.nameFilter.toLowerCase())
      );
      
      const genderMatch = !input.filterGender || athlete.gender === input.filterGender;
      const roundsMatch = this.rounds.every(round => {
        const filter = input.roundFilters[round];
        const value = (athlete as any)[round] || 0;
        return (!filter?.min || value >= filter.min);
      });
      
      const totalPointsfilterMatch = (!input.totalPointsfilter?.min ||athlete.totalpoints >= input.totalPointsfilter.min) && (!input.totalPointsfilter?.max ||athlete.totalpoints <= input.totalPointsfilter.max);
      const weightedPointDeltaFilterMatch = (!input.weightedPointDeltaFilter?.min ||athlete.progressionScore.weightedPointDelta >= input.weightedPointDeltaFilter.min) && (!input.weightedPointDeltaFilter?.max ||athlete.progressionScore.weightedPointDelta <= input.weightedPointDeltaFilter.max);
      const weightedPriceDeltaFilterMatch = (!input.weightedPriceDeltaFilter?.min ||athlete.progressionScore.weightedPriceDelta >= input.weightedPriceDeltaFilter.min) && (!input.weightedPriceDeltaFilter?.max ||athlete.progressionScore.weightedPriceDelta <= input.weightedPriceDeltaFilter.max);
      const injuryFilterMatch = input.injuryfilter !== athlete.injury;
      
      const countryMatch = !input.countryFilter ||athlete.country === input.countryFilter;
      return genderMatch &&
      roundsMatch &&
      totalPointsfilterMatch &&
      injuryFilterMatch &&
      weightedPointDeltaFilterMatch &&
      weightedPriceDeltaFilterMatch &&
      nameMatch &&
      countryMatch;
    });
    this.filteredAthletes.next(fa);

    this.sort();
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
  };

  

  deleteOneFromHistory(number: number) {
    const key = `team/${number}`;
    localStorage.removeItem(key);
    const index = this.historyTeams.map(e => e.number).indexOf(number);
    this.historyTeams.splice(index, 1)
  };

  // loadFromHistory(number: number) {
  //   const key = `team/${number}`;
  //   const team = JSON.parse(localStorage.getItem(key) as string);

  //   if (this.team.length > 0) {
  //     this.saveForLater();
  //   }

  //   this.team = team;
  //   this.sum = this.team.reduce((acc, a) => acc + +a.value, 0);
  //   this.budget = this.money - this.sum;

  //   // this.deleteOneFromHistory(number);
  // };

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


  lst() {
    // const localStorageTeam = JSON.parse(window.localStorage.getItem("team") as string);

    // if (!!localStorageTeam) {
    //   localStorageTeam.forEach((athlete: any) => {
    //     const id = this.data.map((e: any) => e.id).indexOf(athlete.id)
    //     this.data[id].selected = true;
    //   });
    //   this.team = this.data.filter((e: any) => e.selected);

    //   this.sum = this.team.reduce((acc, a) => acc + +a.value, 0);
    //   this.budget = this.money - this.sum;

    //   const stats: any = { sum: 0 };
    //   this.rounds.forEach((rn, i) => {
    //     stats[this.roundsAliases[i]] = {
    //       points: this.team.reduce((acc: any, i: any) => acc + +i[rn], 0),
    //       price: this.team.reduce((acc: any, i: any) => acc + i.valorileVechi[rn], 0)
    //     }
    //     stats.sum += stats[this.roundsAliases[i]].points;
    //   });

    //   this.nrWomenPerTeam = this.team.filter(e => e.gender === "Female").length;
    //   this.nrMenPerTeam = this.team.filter(e => e.gender === "Male").length;

    //   this.currentStats = stats;
    // }

    // this.historyTeams = this.getLSTeamHistory();

    this.progressionScores = this.data.map((a: any) => a.progressionScore).sort((a: any, b: any) => { a.weightedPointDelta - b.weightedPointDelta });

    this.minweightedPointDelta.next(Math.min(...this.progressionScores.map((e: any) => +e.weightedPointDelta) as any));
    this.maxweightedPointDelta.next(Math.max(...this.progressionScores.map((e: any) => +e.weightedPointDelta) as any));
    this.minweightedPriceDelta.next(Math.min(...this.progressionScores.map((e: any) => +e.weightedPriceDelta) as any));
    this.maxweightedPriceDelta.next(Math.max(...this.progressionScores.map((e: any) => +e.weightedPriceDelta) as any));

    this.getInstagramData();
    // this.applyFilters();
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
    this.getinstagramData().subscribe((res) => {
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

  getData(): Observable<any> {
    return this.http.get(this.jsonUrl);
  }

  getqualiStartList(): Observable<any> {
    return this.http.get('assets/elite_riders.json');
  }
  getinstagramData(): Observable<any> {
    return this.http.get('assets/instagram.json');
  }

  actionAthlete(a: any): void {
    const fs = this.filteredAthletes.getValue();
    fs.forEach((athlete: any) => {
      if (a.id == athlete.id) {
        athlete.selected = !athlete.selected;
      }
    });

    this.filteredAthletes.next(fs);    
  }



  // shit

  abbreviations = {
    'j.': 'john',
    'jos.': 'joseph',
    'sam.': 'samuel',
    'Vali': 'Valentina',
    // Add more abbreviations as needed
  };

  /*
  normalizeName(name) {
    let normalized = name.toLowerCase();
    normalized = normalized.replace(/[-.,]/g, ''); // Remove hyphens, periods, and commas
    normalized = normalized.replace(/\s+/g, ' ').trim(); // Replace multiple spaces with a single space
    const parts = normalized.split(' ');
    const expandedParts = parts.map(part => abbreviations[part] || part);
    return expandedParts.join(' ');
  }
  */



  ompareNameLists(list1: any, list2: any) {
    const normalizedList2 = list2.map((name: string) => ({ original: name, normalized: this.normalizeName(name) }));

    const fuse = new Fuse(normalizedList2, {
      keys: ['normalized'],
      includeScore: true,
      threshold: 0.6, // Adjust this threshold to control the fuzziness (0.0 is a perfect match, 1.0 matches anything)
    });

    const matches = [];
    for (const name1 of list1) {
      const normalizedName1 = this.normalizeName(name1);
      const result: any = fuse.search(normalizedName1);

      if (result.length > 0) {
        matches.push({
          nameFromList1: name1,
          bestMatchFromList2: result[0].item.original,
          score: result[0].score,
        });
      } else {
        matches.push({
          nameFromList1: name1,
          bestMatchFromList2: null,
          score: null,
        });
      }
    }
    return matches;
  }


  normalizeName(name: string) {
    return name
      .toLowerCase()
      .replace(/\./g, '')                     // Remove periods (e.g., J.R. → JR)
      .replace(/-/g, ' ')                     // Replace hyphens with spaces
      .replace(/\s+/g, ' ')                   // Normalize whitespace
      .trim();
  }

  tokenize(name: string) {
    return this.normalizeName(name).split(' ').filter(Boolean);
  }

  nameSimilarity(nameA: string, nameB: string) {
    const tokensA = this.tokenize(nameA);
    const tokensB = this.tokenize(nameB);

    let matches = 0;
    tokensA.forEach((tokenA: any) => {
      if (tokensB.includes(tokenA)) matches++;
    });

    // Weighted score based on shared tokens
    const maxTokens = Math.max(tokensA.length, tokensB.length);
    return matches / maxTokens;
  }

  compareNameLists(listA: any, listB: any, threshold = 0.6) {
    const matches: any = [];

    listA.forEach((nameA: string) => {
      let bestMatch = null;
      let highestScore = 0;

      listB.forEach((nameB: string) => {
        const score = this.nameSimilarity(nameA, nameB);
        if (score > highestScore) {
          bestMatch = nameB;
          highestScore = score;
        }
      });

      if (highestScore >= threshold) {
        matches.push({
          nameA,
          match: bestMatch,
          score: highestScore.toFixed(2),
        });
      } else {
        matches.push({
          nameA,
          match: null,
          score: highestScore.toFixed(2),
        });
      }
    });

    return matches;
  }


  // end of shit

}