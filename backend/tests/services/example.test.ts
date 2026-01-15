/**
 * Example Test
 * Verify test setup works
 */

import { describe, it, expect } from 'vitest';

describe('Test Setup', () => {
  it('should run tests', () => {
    expect(true).toBe(true);
  });

  it('should do basic math', () => {
    expect(1 + 1).toBe(2);
  });
});
