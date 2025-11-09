/**
 * Cursor utilities for cursor-based pagination
 * Provides encoding/decoding helpers with validation
 */

import { Buffer } from 'node:buffer';

export interface CursorPayload {
  /**
   * Primary identifier for the cursor (typically the record ID)
   */
  id: string;
  /**
   * Optional sort value for deterministic ordering
   */
  sortValue?: string;
}

/**
 * Encode a cursor payload into a base64 string
 */
export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
}

/**
 * Decode a base64 cursor string into a payload
 */
export function decodeCursor(cursor: string): CursorPayload {
  try {
    const raw = Buffer.from(cursor, 'base64').toString('utf8');
    const parsed = JSON.parse(raw) as CursorPayload;

    if (!parsed || typeof parsed.id !== 'string' || parsed.id.length === 0) {
      throw new Error('Invalid cursor payload');
    }

    if (parsed.sortValue !== undefined && typeof parsed.sortValue !== 'string') {
      throw new Error('Invalid cursor payload');
    }

    return parsed;
  } catch (_error) {
    throw new Error('Invalid cursor');
  }
}

