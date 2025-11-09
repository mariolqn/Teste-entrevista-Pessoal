/**
 * Unit tests for cursor utility helpers
 */

import { describe, expect, it } from 'vitest';
import { encodeCursor, decodeCursor } from '../../../src/utils/cursor.js';

describe('Unit :: utils/cursor', () => {
  it('should encode and decode cursor payloads symmetrically', () => {
    const payload = { id: 'abc-123', sortValue: 'Suzano' };
    const encoded = encodeCursor(payload);
    const decoded = decodeCursor(encoded);

    expect(decoded).toEqual(payload);
  });

  it('should throw error when cursor payload is malformed', () => {
    const invalidCursor = Buffer.from('{"id":""}', 'utf8').toString('base64');
    expect(() => decodeCursor(invalidCursor)).toThrowError('Invalid cursor');
  });

  it('should throw error when cursor is not valid base64', () => {
    expect(() => decodeCursor('this-is-not-base64')).toThrowError('Invalid cursor');
  });
});

