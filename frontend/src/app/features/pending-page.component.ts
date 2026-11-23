import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  template: `
    <section class="panel">
      <h1>{{ heading }}</h1>
      <p>{{ description }}</p>
      <p>Vista en desarrollo.</p>
    </section>
  `,
})
export class PendingPageComponent {
  private readonly data = inject(ActivatedRoute).snapshot.data;
  protected readonly heading = this.data['heading'];
  protected readonly description = this.data['description'];
}
