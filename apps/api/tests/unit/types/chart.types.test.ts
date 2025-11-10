/**
 * Unit tests for chart type validation utilities
 */

import { describe, expect, it } from 'vitest';
import { chartParamsSchema, chartQuerySchema } from '../../../src/types/charts.types.js';

describe('Unit :: Chart Types Validation', () => {
  describe('chartParamsSchema', () => {
    it('should validate correct chart type parameters', () => {
      const validParams = {
        chartType: 'line'
      };

      const result = chartParamsSchema.safeParse(validParams);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.chartType).toBe('line');
      }
    });

    it('should reject invalid chart types', () => {
      const invalidParams = {
        chartType: 'invalid'
      };

      const result = chartParamsSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
    });

    it('should validate all supported chart types', () => {
      const supportedTypes = ['line', 'bar', 'pie', 'table', 'kpi'];
      
      supportedTypes.forEach(type => {
        const result = chartParamsSchema.safeParse({ chartType: type });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('chartQuerySchema', () => {
    it('should validate correct query parameters', () => {
      const validQuery = {
        start: '2024-01-01',
        end: '2024-01-31',
        metric: 'revenue',
        limit: 20
      };

      const result = chartQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it('should require start and end dates', () => {
      const invalidQuery = {
        metric: 'revenue'
      };

      const result = chartQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('start') || issue.path.includes('end')
        )).toBe(true);
      }
    });

    it('should validate metric enum values', () => {
      const validMetrics = ['revenue', 'expense', 'quantity', 'count'];
      
      validMetrics.forEach(metric => {
        const query = {
          start: '2024-01-01',
          end: '2024-01-31',
          metric,
          limit: 20
        };
        const result = chartQuerySchema.safeParse(query);
        expect(result.success).toBe(true);
      });
    });

    it('should validate groupBy enum values', () => {
      const validGroupBy = ['day', 'week', 'month'];
      
      validGroupBy.forEach(groupBy => {
        const query = {
          start: '2024-01-01',
          end: '2024-01-31',
          metric: 'revenue',
          groupBy,
          limit: 20
        };
        const result = chartQuerySchema.safeParse(query);
        expect(result.success).toBe(true);
      });
    });

    it('should validate dimension enum values', () => {
      const validDimensions = ['category', 'product', 'customer', 'region'];
      
      validDimensions.forEach(dimension => {
        const query = {
          start: '2024-01-01',
          end: '2024-01-31',
          metric: 'revenue',
          dimension,
          limit: 20
        };
        const result = chartQuerySchema.safeParse(query);
        expect(result.success).toBe(true);
      });
    });

    it('should validate limit bounds', () => {
      // Test minimum
      const minQuery = {
        start: '2024-01-01',
        end: '2024-01-31', 
        metric: 'revenue',
        limit: 1
      };
      expect(chartQuerySchema.safeParse(minQuery).success).toBe(true);

      // Test maximum  
      const maxQuery = {
        start: '2024-01-01',
        end: '2024-01-31',
        metric: 'revenue', 
        limit: 100
      };
      expect(chartQuerySchema.safeParse(maxQuery).success).toBe(true);

      // Test invalid
      const invalidQuery = {
        start: '2024-01-01',
        end: '2024-01-31',
        metric: 'revenue',
        limit: 0
      };
      expect(chartQuerySchema.safeParse(invalidQuery).success).toBe(false);
    });

    it('should validate topN parameter', () => {
      const query = {
        start: '2024-01-01',
        end: '2024-01-31',
        metric: 'revenue',
        topN: 5,
        limit: 20
      };

      const result = chartQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.topN).toBe(5);
      }
    });
  });
});
