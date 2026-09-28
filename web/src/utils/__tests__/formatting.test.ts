import { describe, expect, it } from 'vitest';
import { formatFallback, sortPointsByDeviceTimestamp } from '../formatting';
import { RoutePoint } from '../../types';

describe('formatFallback', () => {
  it('returns fallback hyphen for null or undefined metadata', () => {
    expect(formatFallback(null)).toBe('—');
    expect(formatFallback(undefined)).toBe('—');
    expect(formatFallback('')).toBe('—');
  });

  it('formats numbers with units correctly', () => {
    expect(formatFallback(12.345, 'm/s')).toBe('12.3 m/s');
    expect(formatFallback(90, '°')).toBe('90 °');
  });
});

describe('sortPointsByDeviceTimestamp', () => {
  it('defensively sorts out-of-order route points by device_timestamp ASC', () => {
    const rawPoints = [
      { id: '3', device_timestamp: '2026-09-28T09:00:00Z' },
      { id: '1', device_timestamp: '2026-09-28T08:00:00Z' },
      { id: '2', device_timestamp: '2026-09-28T08:30:00Z' },
    ] as RoutePoint[];

    const sorted = sortPointsByDeviceTimestamp(rawPoints);
    expect(sorted.map((p) => p.id)).toEqual(['1', '2', '3']);
  });
});
