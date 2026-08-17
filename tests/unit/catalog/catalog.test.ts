import { describe, it, expect } from 'vitest';
import { LAUNCH_SUBJECTS_CATALOG } from '@/config/subjects_catalog';
import { rateLimit } from '@/lib/rate-limit';

describe('Expanded Subject Catalog & Rate Limiting Pass', () => {
  it('contains all 6 core launch subjects', () => {
    expect(LAUNCH_SUBJECTS_CATALOG.length).toBe(6);
    const slugs = LAUNCH_SUBJECTS_CATALOG.map((s) => s.slug);
    expect(slugs).toContain('ap-us-history');
    expect(slugs).toContain('ap-world-history');
    expect(slugs).toContain('ap-lang');
    expect(slugs).toContain('ap-calculus-ab');
    expect(slugs).toContain('ap-chemistry');
    expect(slugs).toContain('ap-biology');
  });

  it('enforces rate limits correctly', () => {
    const key = 'test-client-ip';
    const limit = 3;
    expect(rateLimit(key, limit, 10000).success).toBe(true);
    expect(rateLimit(key, limit, 10000).success).toBe(true);
    expect(rateLimit(key, limit, 10000).success).toBe(true);
    expect(rateLimit(key, limit, 10000).success).toBe(false);
  });
});
