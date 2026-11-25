import { describe, expect, it } from 'vitest';
import {
  CATHEDRAL,
  DESCENT,
  DESCENT_STEP_COUNT,
  THRESHOLD,
  cssTokens,
  descentPalette,
  mixOklab,
} from './palettes';

describe('mixOklab', () => {
  it('returns the endpoints at t = 0 and t = 1', () => {
    expect(mixOklab('#52a0b8', '#c41634', 0)).toBe('#52a0b8');
    expect(mixOklab('#52a0b8', '#c41634', 1)).toBe('#c41634');
  });
});

describe('descentPalette', () => {
  it('starts at the Threshold and ends at the Cathedral', () => {
    expect(descentPalette(0)).toEqual(THRESHOLD);
    expect(descentPalette(1)).toEqual(CATHEDRAL);
  });

  it('clamps progress outside 0..1', () => {
    expect(descentPalette(-1)).toEqual(THRESHOLD);
    expect(descentPalette(2)).toEqual(CATHEDRAL);
  });

  it('snaps to hard steps instead of fading', () => {
    expect(descentPalette(0.45)).toEqual(descentPalette(0.5));
    expect(descentPalette(0.5)).toEqual({
      void: '#0d0303',
      shade: '#4d2135',
      signal: '#a07078',
      light: '#e2b190',
    });
  });

  it('precomputes every step', () => {
    expect(DESCENT).toHaveLength(DESCENT_STEP_COUNT);
    expect(DESCENT[0]).toEqual(THRESHOLD);
    expect(DESCENT[DESCENT_STEP_COUNT - 1]).toEqual(CATHEDRAL);
  });
});

describe('cssTokens', () => {
  it('emits role tokens for each world scope', () => {
    const css = cssTokens();
    expect(css).toContain('--cathedral-signal: #c41634;');
    expect(css).toContain('--crimson-text: #e0405a;');
    expect(css).toContain('[data-world="descent-3"] {');
    expect(css).toContain('--world-signal: #52a0b8;');
  });
});
