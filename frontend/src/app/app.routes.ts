import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    title: 'Acceso | S.O.S. Geo',
    loadComponent: () => import('./features/auth/auth-page.component').then(m => m.AuthPageComponent),
  },
  {
    path: '',
    canActivateChild: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'map' },
      {
        path: 'map',
        title: 'Mapa | S.O.S. Geo',
        loadComponent: () => import('./features/map/map-dashboard-page.component').then(m => m.MapDashboardPageComponent),
      },
      {
        path: 'directory',
        title: 'Directorio | S.O.S. Geo',
        loadComponent: () => import('./features/directory/directory-admin-page.component').then(m => m.DirectoryAdminPageComponent),
      },
      {
        path: 'requests',
        title: 'Solicitudes | S.O.S. Geo',
        loadComponent: () => import('./features/requests/requests-admin-page.component').then(m => m.RequestsAdminPageComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'map' },
];
