import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ditherVersion } from '@site/dither';
import { Seo } from '../seo';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main>
      <h1>Personal site</h1>
      <p>Engine: {{ version }}</p>
      <button type="button" (click)="loadGame()">Load game</button>
    </main>
  `,
})
export class Home {
  protected readonly version = ditherVersion();

  constructor() {
    inject(Seo).setPage('/');
  }

  protected async loadGame(): Promise<void> {
    try {
      const { bootGame } = await import('@site/game');
      console.log(bootGame());
    } catch (error) {
      console.error('Could not load the game', error);
    }
  }
}
