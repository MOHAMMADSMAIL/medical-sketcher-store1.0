import { describe, expect, it } from '@jest/globals';

describe('Aurelia core purchase flow prerequisites', () => {
  it('requires an explicit PostgreSQL DATABASE_URL for runtime E2E', () => {
    const url = process.env.DATABASE_URL || '';
    expect(url.startsWith('postgresql://') || url.startsWith('postgres://')).toBe(true);
  });
});

// Full HTTP journey tests must run against a clean PostgreSQL database and are intentionally
// not replaced by mocks. Add the register → payment → download assertions once the DB service is available.
