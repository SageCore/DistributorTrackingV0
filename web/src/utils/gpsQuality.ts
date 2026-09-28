import { GpsQuality } from '../types';

/**
 * Classifies reported GPS accuracy into diagnostic quality tiers.
 * Thresholds:
 * - <= 20m: EXCELLENT
 * - 20.01m to 40m: ACCEPTABLE
 * - 40.01m to 75m: LOW CONFIDENCE
 * - > 75m or null: POOR
 */
export const getGpsQuality = (accuracyMeters: number | null | undefined): GpsQuality => {
  if (accuracyMeters == null || isNaN(accuracyMeters) || accuracyMeters < 0) {
    return 'POOR';
  }
  if (accuracyMeters <= 20) {
    return 'EXCELLENT';
  }
  if (accuracyMeters <= 40) {
    return 'ACCEPTABLE';
  }
  if (accuracyMeters <= 75) {
    return 'LOW CONFIDENCE';
  }
  return 'POOR';
};

export const getGpsQualityColorClass = (quality: GpsQuality): string => {
  switch (quality) {
    case 'EXCELLENT':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case 'ACCEPTABLE':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'LOW CONFIDENCE':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'POOR':
      return 'bg-rose-100 text-rose-800 border-rose-300';
  }
};
