import { describe, expect, it } from 'vitest';
import { ditherVersion } from './index';

describe('ditherVersion', () => {
  it('returns the package version tag', () => {
    expect(ditherVersion()).toBe('dither@0.0.0');
  });
});
