import { describe, expect, it } from 'vitest';
import { bootGame } from './index';

describe('bootGame', () => {
  it('returns a boot message', () => {
    expect(bootGame()).toBe('game booted');
  });
});
