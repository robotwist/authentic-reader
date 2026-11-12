// Plain-language labels for the analysis scores, using the bands the analysis
// is calibrated to. Keep in step with argumentVerdict in netlify/lib/opinion.mjs.

export function argumentVerdict(overall: number): string {
  if (overall >= 90) return 'A rigorous case';
  if (overall >= 70) return 'A solid case, with gaps';
  if (overall >= 50) return 'A case with notable gaps';
  return 'Mostly rhetoric';
}

export function partVerdict(score: number): 'strong' | 'mixed' | 'weak' {
  if (score >= 75) return 'strong';
  if (score >= 50) return 'mixed';
  return 'weak';
}

/** The lean label, saying how much evidence of lean there is; confidence is 0 to 100. */
export function leanLabel(lean: string, confidence: number | null): string {
  if (lean === 'center') return 'Reads as center';
  if (confidence === null) return `Leans ${lean}`;
  const signs = confidence >= 75 ? 'clear signs' : confidence >= 50 ? 'some signs' : 'few signs';
  return `Leans ${lean}, ${signs}`;
}
