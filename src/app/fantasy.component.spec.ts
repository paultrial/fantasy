import { of } from 'rxjs';
import { FantasyComponent } from './fantasy.component';

describe('FantasyComponent', () => {
  let component: FantasyComponent;

  beforeEach(() => {
    component = new FantasyComponent({ getData: () => of([]) } as any, { snapshot: { data: {} } } as any);
    component.rounds = ['round1', 'round2'];
    component.rounds.forEach((round) => {
      component.roundFilters[round] = { min: undefined, max: undefined };
    });
    component.data = [
      {
        firstname: 'Jane',
        lastname: 'Doe',
        gender: 'Female',
        value: 100,
        totalpoints: 200,
        round1: 10,
        round2: 20,
        roundsPoints: [{ round1: 10 }, { round2: 20 }],
        injury: false,
        country: 'US',
        progressionScore: { weightedPointDelta: 1, weightedPriceDelta: 2 },
      }
    ];
    component.filteredAthletes = [];
    component.nameFilter = '';
    component.filterGender = '';
    component.countryFilter = '';
    component.injuryfilter = undefined;
    component.priceFilter = { min: undefined, max: undefined };
    component.totalPointsfilter = { min: undefined, max: undefined };
    component.weightedPointDeltaFilter = { min: undefined, max: undefined };
    component.weightedPriceDeltaFilter = { min: undefined, max: undefined };
    component.sortKey = { key: 'value', direction: 'rw' };
  });

  it('matches athletes when any round score falls within the configured range', () => {
    component.pointsAtLeastOneRoundFilter = { min: 15, max: 25 };

    component.applyFilters();

    expect(component.filteredAthletes.length).toBe(1);
  });

  it('does not match athletes when no round score falls within the configured range', () => {
    component.pointsAtLeastOneRoundFilter = { min: 30, max: 40 };

    component.applyFilters();

    expect(component.filteredAthletes.length).toBe(0);
  });
});
