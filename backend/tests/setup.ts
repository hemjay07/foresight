/**
 * Test Setup
 * Runs before all tests
 */

import { beforeAll, afterAll } from 'vitest';

// Set test environment
process.env.NODE_ENV = 'test';

beforeAll(async () => {
  // Any global setup
  console.log('Test suite starting...');
});

afterAll(async () => {
  // Any global cleanup
  console.log('Test suite complete.');
});
