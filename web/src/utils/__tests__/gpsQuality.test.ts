import { describe, expect, it } from 'vitest';
import { getGpsQuality } from '../gpsQuality';

describe('getGpsQuality', () => {
  it('correctly classifies <= 20 m as EXCELLENT', () => {
    expect(getGpsQuality(5)).toBe('EXCELLENT');
    expect(getGpsQuality(20)).toBe('EXCELLENT');
  });

  it('correctly classifies > 20 and <= 40 m as ACCEPTABLE', () => {
    expect(getGpsQuality(20.1)).toBe('ACCEPTABLE');
    expect(getGpsQuality(30)).toBe('ACCEPTABLE');
    expect(getGpsQuality(40)).toBe('ACCEPTABLE');
  });

  it('correctly classifies > 40 and <= 75 m as LOW CONFIDENCE', () => {
    expect(getGpsQuality(40.1)).toBe('LOW CONFIDENCE');
    expect(getGpsQuality(60)).toBe('LOW CONFIDENCE');
    expect(getGpsQuality(75)).toBe('LOW CONFIDENCE');
  });

  it('correctly classifies > 75 m or null as POOR', () => {
    expect(getGpsQuality(75.1)).toBe('POOR');
    expect(getGpsQuality(100)).toBe('POOR');
    expect(getGpsQuality(null)).toBe('POOR');
    expect(getGpsQuality(undefined)).toBe('POOR');
  });
});
