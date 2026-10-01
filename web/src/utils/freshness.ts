import { FreshnessStatus } from '../types';

export const getFreshnessStatus = (lastSeenIso: string | null | undefined): FreshnessStatus => {
  if (!lastSeenIso) return 'OFFLINE';
  try {
    const lastSeenTime = new Date(lastSeenIso).getTime();
    if (isNaN(lastSeenTime)) return 'OFFLINE';

    const diffMs = Date.now() - lastSeenTime;
    const diffMinutes = diffMs / (1000 * 60);

    if (diffMinutes < 2) return 'FRESH';
    if (diffMinutes <= 10) return 'STALE';
    return 'OFFLINE';
  } catch {
    return 'OFFLINE';
  }
};

export const getFreshnessLabel = (lastSeenIso: string | null | undefined): string => {
  if (!lastSeenIso) return 'Offline';
  try {
    const lastSeenTime = new Date(lastSeenIso).getTime();
    if (isNaN(lastSeenTime)) return 'Offline';

    const diffSeconds = Math.max(0, Math.floor((Date.now() - lastSeenTime) / 1000));
    if (diffSeconds < 60) return `${diffSeconds} sec ago`;

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} min ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours} hr ago`;
  } catch {
    return 'Offline';
  }
};

export const formatFreshnessStatus = (status: FreshnessStatus, lastSeenIso?: string | null): string => {
  const timeLabel = getFreshnessLabel(lastSeenIso);
  switch (status) {
    case 'FRESH':
      return `Fresh (${timeLabel})`;
    case 'STALE':
      return `Stale (${timeLabel})`;
    case 'OFFLINE':
      return `Offline (${timeLabel})`;
  }
};

export const getFreshnessBadgeColor = (status: FreshnessStatus): string => {
  switch (status) {
    case 'FRESH':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case 'STALE':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'OFFLINE':
      return 'bg-slate-100 text-slate-700 border-slate-300';
  }
};

export const getFreshnessBadgeClass = (status: FreshnessStatus): string => {
  return status.toLowerCase();
};
