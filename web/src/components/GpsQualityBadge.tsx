import React from 'react';
import { GpsQuality } from '../types';
import { getGpsQuality, getGpsQualityColorClass } from '../utils/gpsQuality';

interface GpsQualityBadgeProps {
  accuracyMeters: number | null | undefined;
}

export const GpsQualityBadge: React.FC<GpsQualityBadgeProps> = ({ accuracyMeters }) => {
  const quality: GpsQuality = getGpsQuality(accuracyMeters);
  const colorClass = getGpsQualityColorClass(quality);

  return (
    <span className={`badge ${colorClass}`}>
      {quality}
    </span>
  );
};
