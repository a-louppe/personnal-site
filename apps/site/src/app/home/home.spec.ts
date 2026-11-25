import { TestBed } from '@angular/core/testing';
import { Home } from './home';

describe('Home', () => {
  it('renders the dither version and a load button', async () => {
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Personal site');
    expect(el.textContent).toContain('dither@0.0.0');
    expect(el.querySelector('button[type="button"]')).toBeTruthy();
  });
});
