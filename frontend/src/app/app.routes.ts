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
        data: { heading: 'Mapa', description: 'Consulta las ubicaciones y zonas de servicio.' },
        loadComponent: () => import('./features/pending-page.component').then(m => m.PendingPageComponent),
      },
      {
        path: 'directory',
        title: 'Directorio | S.O.S. Geo',
        data: { heading: 'Directorio', description: 'Administra las categorías y los profesionales.' },
        loadComponent: () => import('./features/pending-page.component').then(m => m.PendingPageComponent),
      },
      {
        path: 'requests',
        title: 'Solicitudes | S.O.S. Geo',
        data: { heading: 'Solicitudes', description: 'Consulta y administra las solicitudes de servicio.' },
        loadComponent: () => import('./features/pending-page.component').then(m => m.PendingPageComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'map' },
];
