// No dependencies: imported by the email script, which runs without installed packages.

/** Plain-language label for an argument score, using the bands the analysis is calibrated to. Keep in step with src/lib/verdicts.ts. */
export function argumentVerdict(overall) {
  if (overall >= 90) return 'A rigorous case';
  if (overall >= 70) return 'A solid case, with gaps';
  if (overall >= 50) return 'A case with notable gaps';
  return 'Mostly rhetoric';
}

/** One line on what to notice in a story. Editions before watchFor existed fall back to the first flagged passage; keep in step with cardWatchFor in src/pages/DailyBriefingPage.tsx. */
export function storyWatchFor(story) {
  const stored = story.analysis?.watchFor?.finding;
  if (stored) return stored;
  const first = story.analysis?.manipulationAnalysis?.logicalFallacies?.[0];
  if (first) return `${first.type}: \u201c${first.location.length > 90 ? `${first.location.slice(0, 90)}\u2026` : first.location}\u201d`;
  return 'No misleading techniques in the outlet\u2019s own words.';
}
