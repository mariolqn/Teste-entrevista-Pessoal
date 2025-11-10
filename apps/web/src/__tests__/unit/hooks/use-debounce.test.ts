/**
 * Tests for use-debounce hook
 */

import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { useDebouncedValue } from '@/hooks/use-debounce';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('initial'));
    
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes with default delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current).toBe('initial');

    // Update the value
    rerender({ value: 'updated' });
    
    // Should still be the old value immediately
    expect(result.current).toBe('initial');

    // Fast-forward time by default delay (300ms)
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Now should be the updated value
    expect(result.current).toBe('updated');
  });

  it('should debounce value changes with custom delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated', delay: 500 });
    expect(result.current).toBe('initial');

    // Fast-forward by less than custom delay
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(result.current).toBe('initial');

    // Fast-forward by the remaining time
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe('updated');
  });

  it('should cancel previous timer on rapid value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'first-update' });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Second update before first completes
    rerender({ value: 'second-update' });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Should still be initial since neither completed
    expect(result.current).toBe('initial');

    // Complete the timer
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Should be the latest value
    expect(result.current).toBe('second-update');
  });

  it('should handle different value types', () => {
    // Test with numbers
    const { result: numberResult, rerender: rerenderNumber } = renderHook(
      ({ value }) => useDebouncedValue(value, 100),
      { initialProps: { value: 0 } }
    );

    rerenderNumber({ value: 42 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(numberResult.current).toBe(42);

    // Test with objects
    const { result: objectResult, rerender: rerenderObject } = renderHook(
      ({ value }) => useDebouncedValue(value, 100),
      { initialProps: { value: { count: 0 } } }
    );

    const newObj = { count: 1 };
    rerenderObject({ value: newObj });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(objectResult.current).toBe(newObj);

    // Test with arrays
    const { result: arrayResult, rerender: rerenderArray } = renderHook(
      ({ value }) => useDebouncedValue(value, 100),
      { initialProps: { value: [1, 2] } }
    );

    const newArray = [3, 4, 5];
    rerenderArray({ value: newArray });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(arrayResult.current).toBe(newArray);
  });

  it('should handle zero delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 0),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });
    
    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(result.current).toBe('updated');
  });

  it('should handle delay changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    );

    // Update value
    rerender({ value: 'updated', delay: 300 });

    // Change delay before timer completes
    rerender({ value: 'updated', delay: 100 });

    // Should complete with the new delay
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toBe('updated');
  });

  it('should cleanup timers on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    
    const { unmount, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    // Unmount before timer completes
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });
});
