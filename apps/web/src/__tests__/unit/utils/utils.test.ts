/**
 * Tests for utility functions
 */

import { describe, expect, it } from 'vitest';

import { cn } from '@/lib/utils';

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    const result = cn('px-2 py-1', 'bg-blue-500');
    expect(result).toBe('px-2 py-1 bg-blue-500');
  });

  it('should handle conditional classes with clsx', () => {
    const isActive = true;
    const isDisabled = false;

    const result = cn('base-class', {
      'active-class': isActive,
      'disabled-class': isDisabled,
    });

    expect(result).toBe('base-class active-class');
  });

  it('should handle Tailwind merge conflicts', () => {
    const result = cn('px-2 px-4', 'py-1 py-2');
    // tailwind-merge should keep the later classes
    expect(result).toBe('px-4 py-2');
  });

  it('should handle array inputs', () => {
    const result = cn(['px-2', 'py-1'], ['bg-blue-500', 'text-white']);
    expect(result).toBe('px-2 py-1 bg-blue-500 text-white');
  });

  it('should handle falsy values', () => {
    const result = cn('base-class', false, null, undefined, '', 'valid-class');
    expect(result).toBe('base-class valid-class');
  });

  it('should handle complex Tailwind conflicts', () => {
    const result = cn(
      'bg-red-500 bg-blue-500', // Should keep bg-blue-500
      'p-2 px-4', // Should keep px-4 but keep p-2 for py
      'm-2 mx-8' // Should keep mx-8 but keep m-2 for my
    );

    // Note: exact behavior depends on tailwind-merge implementation
    expect(result).toContain('bg-blue-500');
    expect(result).toContain('px-4');
    expect(result).toContain('mx-8');
  });

  it('should handle empty inputs', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
    expect(cn(null)).toBe('');
    expect(cn(undefined)).toBe('');
  });

  it('should handle nested conditionals', () => {
    const sizeFlags = {
      small: false,
      medium: false,
      large: true,
    };
    const variantFlags = {
      primary: true,
      secondary: false,
    };

    const result = cn(
      'base',
      {
        'text-sm': sizeFlags.small,
        'text-base': sizeFlags.medium,
        'text-lg': sizeFlags.large,
      },
      {
        'bg-blue-500': variantFlags.primary,
        'bg-gray-500': variantFlags.secondary,
      }
    );

    expect(result).toBe('base text-lg bg-blue-500');
  });

  it('should preserve order when no conflicts exist', () => {
    const result = cn('first', 'second', 'third');
    expect(result).toBe('first second third');
  });

  it('should handle mixed input types', () => {
    const result = cn(
      'base-class',
      ['array-class-1', 'array-class-2'],
      {
        'conditional-true': true,
        'conditional-false': false,
      },
      'final-class'
    );

    expect(result).toBe('base-class array-class-1 array-class-2 conditional-true final-class');
  });
});
