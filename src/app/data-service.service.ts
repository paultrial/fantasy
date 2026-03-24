import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import Fuse from 'fuse.js';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private defaultJsonUrl = 'assets/PBathletes.json';

  constructor(private http: HttpClient) { }

  getData(jsonUrl: string = this.defaultJsonUrl): Observable<any> {
    return this.http.get(jsonUrl);
  }

  getqualiStartList(): Observable<any> {
    return this.http.get('assets/elite_riders.json');
  }
  getinstagramData(): Observable<any> {
    return this.http.get('assets/instagram.json');
  }
   
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
      const result:any = fuse.search(normalizedName1);

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
