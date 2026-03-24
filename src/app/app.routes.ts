import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./fantasy.component').then((m) => m.FantasyComponent),
    data: { dataFile: 'assets/PBathletes.json' }
  },
  {
    path: '2025',
    loadComponent: () => import('./fantasy.component').then((m) => m.FantasyComponent),
    data: { dataFile: 'assets/2025.json' }
  },
  {
    path: '**',
    redirectTo: ''
  }
];
