import { RoutePoint } from '../types';

export const formatTimestamp = (isoString: string | null | undefined): string => {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    }).format(date);
  } catch {
    return isoString;
  }
};

export const formatDuration = (minutes: number | null | undefined): string => {
  if (minutes === null || minutes === undefined || isNaN(minutes)) return '—';
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hrs === 0) return `${mins}m`;
  return `${hrs}h ${mins}m`;
};

export const formatRelativeTime = (isoString: string | null | undefined): string => {
  if (!isoString) return 'Never';
  try {
    const time = new Date(isoString).getTime();
    if (isNaN(time)) return 'Never';
    const diffSec = Math.max(0, Math.floor((Date.now() - time) / 1000));
    if (diffSec < 60) return `${diffSec} sec ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHrs = Math.floor(diffMin / 60);
    return `${diffHrs} hr ago`;
  } catch {
    return 'Never';
  }
};

export const formatFallback = (
  value: number | string | boolean | null | undefined,
  unit: string = ''
): string => {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'number') {
    const formatted = Number.isInteger(value) ? value.toString() : value.toFixed(1);
    return unit ? `${formatted} ${unit}` : formatted;
  }
  return unit ? `${value} ${unit}` : String(value);
};

export const sortPointsByDeviceTimestamp = (points: RoutePoint[]): RoutePoint[] => {
  if (!points || !Array.isArray(points)) return [];
  return [...points].sort((a, b) => {
    const timeA = new Date(a.device_timestamp).getTime();
    const timeB = new Date(b.device_timestamp).getTime();
    return timeA - timeB;
  });
};
