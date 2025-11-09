import '@testing-library/jest-dom/vitest';

import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// Mock IntersectionObserver for tests
class IntersectionObserverMock implements IntersectionObserver {
  readonly root: Element | Document | null = null;

  readonly rootMargin = '';

  readonly thresholds: ReadonlyArray<number> = [];

  observe = vi.fn();

  unobserve = vi.fn();

  disconnect = vi.fn();

  takeRecords = vi.fn(() => []);
}

Object.defineProperty(globalThis, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserverMock,
});

