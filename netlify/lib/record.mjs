// The public record of how the analysis is checked: hand-check results and
// corrections. Both live in the briefings store.

export const CORRECTIONS_KEY = 'meta/corrections';
export const CHECK_PREFIX = 'checks/';
const SUMMARY_DAYS = 28;

export async function loadCorrections(store) {
  return (await store.get(CORRECTIONS_KEY, { type: 'json' })) || [];
}

/** Appends a correction, newest first. */
export async function addCorrection(store, correction) {
  const corrections = await loadCorrections(store);
  const entry = { id: `${correction.date}-${corrections.length + 1}`, ...correction };
  await store.setJSON(CORRECTIONS_KEY, [entry, ...corrections]);
  return entry;
}

const isoDay = (date) => date.toISOString().slice(0, 10);

/** Totals for the last four weeks and for all sessions. */
export function summarizeChecks(sessions, now = new Date()) {
  const since = isoDay(new Date(now.getTime() - SUMMARY_DAYS * 24 * 3600 * 1000));
  const tally = (list) => {
    const items = list.flatMap((s) => s.items || []).filter((i) => i.judgment !== 'skip');
    const count = (judgment) => items.filter((i) => i.judgment === judgment).length;
    return { total: items.length, agreed: count('agree'), partly: count('partly'), disagreed: count('disagree') };
  };
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  return {
    recent: { since, ...tally(sorted.filter((s) => s.date >= since)) },
    allTime: tally(sorted),
    lastChecked: sorted[0]?.date || null
  };
}

export async function loadCheckSessions(store) {
  const { blobs } = await store.list({ prefix: CHECK_PREFIX });
  return (await Promise.all(blobs.map((b) => store.get(b.key, { type: 'json' })))).filter(Boolean);
}
