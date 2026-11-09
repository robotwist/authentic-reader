import { API_CONFIG } from '../config/api.config';

type View = 'home' | 'story' | 'method' | 'archive';

const LAST_VISIT_KEY = 'daily-authentic:last-visit';
let visitReported = false;

function optedOut(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.doNotTrack === '1' || nav.globalPrivacyControl === true;
}

/**
 * Whether this page load is the device's first view today, and whether it has
 * visited before. Only a date is kept on the device; no identifier is created.
 * Reported once per page load. If storage is unavailable, the visit is not
 * counted rather than counted twice.
 */
function visitFlags(): { firstToday: boolean; returning: boolean } {
  if (visitReported) return { firstToday: false, returning: false };
  visitReported = true;
  try {
    const today = new Date().toISOString().slice(0, 10);
    const last = localStorage.getItem(LAST_VISIT_KEY);
    localStorage.setItem(LAST_VISIT_KEY, today);
    const firstToday = last !== today;
    return { firstToday, returning: firstToday && Boolean(last) };
  } catch {
    return { firstToday: false, returning: false };
  }
}

export function recordView(view: View, story?: string) {
  if (optedOut()) return;
  const body = JSON.stringify({ view, story, ...visitFlags() });
  fetch(`${API_CONFIG.BASE_URL}/api/hit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true
  }).catch(() => undefined);
}
