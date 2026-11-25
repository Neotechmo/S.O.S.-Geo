import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AlertToastComponent } from './shared/components/alert-toast/alert-toast.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, AlertToastComponent],
  template: `
    <app-navbar />
    <app-alert-toast />
    <main><router-outlet /></main>
  `,
})
export class AppComponent {}
