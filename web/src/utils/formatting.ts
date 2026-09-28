import { RoutePoint } from '../types';

export const formatTimestamp = (isoString: string | null | undefined): string => {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    // Output formatted UTC timestamp
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
    // Format nicely rounded number
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
