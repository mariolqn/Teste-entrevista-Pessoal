import '@testing-library/jest-dom/vitest';

import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

const noopRecords = () => [] as IntersectionObserverEntry[];

afterEach(() => {
  cleanup();
});

// Mock IntersectionObserver for tests
class IntersectionObserverMock implements IntersectionObserver {
  readonly root: Element | Document | null = null;

  readonly rootMargin = '';

  readonly thresholds: readonly number[] = [];

  observe = vi.fn();

  unobserve = vi.fn();

  disconnect = vi.fn();

  takeRecords = vi.fn(noopRecords);
}

Object.defineProperty(globalThis, 'IntersectionObserver', {
  configurable: true,
  value: IntersectionObserverMock,
  writable: true,
});

// Mock ResizeObserver for components relying on layout measurements
class ResizeObserverMock implements ResizeObserver {
  observe = vi.fn();

  unobserve = vi.fn();

  disconnect = vi.fn();
}

Object.defineProperty(globalThis, 'ResizeObserver', {
  configurable: true,
  value: ResizeObserverMock,
  writable: true,
});
