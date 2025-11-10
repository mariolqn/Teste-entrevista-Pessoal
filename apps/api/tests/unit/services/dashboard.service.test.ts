/**
 * Unit tests for DashboardService cache control and utility methods
 */

import { describe, expect, it } from 'vitest';
import { DashboardService } from '../../../src/services/dashboard/dashboard.service.js';

// Simple unit tests for utility methods without mocking Prisma
describe('Unit :: DashboardService Utilities', () => {
  describe('getCacheControlHeader', () => {
    it('should return cache control header string', () => {
      const service = new DashboardService({} as any);
      const cacheControl = service.getCacheControlHeader();
      
      expect(cacheControl).toBe('private, max-age=60, stale-while-revalidate=30');
      expect(typeof cacheControl).toBe('string');
      expect(cacheControl).toContain('private');
      expect(cacheControl).toContain('max-age');
    });
  });
});
