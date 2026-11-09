// Scheduled functions are capped at 30 seconds, so this only kicks off the
// background function that does the real work. Later runs in the day only
// fill in steps that earlier runs could not finish (e.g. Groq daily limits).
export default async () => {
  const siteUrl = process.env.URL;
  const response = await fetch(`${siteUrl}/.netlify/functions/generate-briefing-background`, {
    method: 'POST',
    headers: { 'x-briefing-secret': process.env.BRIEFING_SECRET || '' }
  });
  console.log(`Triggered briefing generation: HTTP ${response.status}`);
};

export const config = {
  schedule: '0 11,16,21 * * *'
};
