import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Seo } from '../seo';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main>
      <h1>Page not found</h1>
      <p>This page does not exist.</p>
      <a routerLink="/">Back to the home page</a>
    </main>
  `,
})
export class NotFound {
  constructor() {
    inject(Seo).setNoIndex();
  }
}
