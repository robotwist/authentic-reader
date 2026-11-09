import { getStore } from '@netlify/blobs';
import { generateBriefing } from '../lib/briefing.mjs';

// Background function (15 minute limit). Triggered daily by briefing-cron, or
// manually with: curl -X POST -H "x-briefing-secret: $BRIEFING_SECRET" <site>/.netlify/functions/generate-briefing-background
export default async (req) => {
  const secret = process.env.BRIEFING_SECRET;
  if (!secret || req.headers.get('x-briefing-secret') !== secret) {
    console.warn('generate-briefing-background: rejected request without a valid secret');
    return;
  }

  const started = Date.now();
  try {
    const store = getStore({ name: 'briefings', consistency: 'strong' });
    const summary = await generateBriefing(store, { deadline: started + 13 * 60 * 1000 });
    console.log(`Briefing ${summary.date} run finished in ${Math.round((Date.now() - started) / 1000)}s`, JSON.stringify(summary));
  } catch (error) {
    console.error('Briefing generation failed:', error);
  }
};
