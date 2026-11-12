import { briefingsStore } from '../lib/store.mjs';
import { generateBriefing, utcDate } from '../lib/briefing.mjs';
import { emailEnabled, readyToSend, sendEdition } from '../lib/email.mjs';

// Background function (15 minute limit). Triggered daily by briefing-cron, or
// manually with: curl -X POST -H "x-briefing-secret: $BRIEFING_SECRET" <site>/.netlify/functions/generate-briefing-background
export default async (req, context) => {
  const secret = process.env.BRIEFING_SECRET;
  if (!secret || req.headers.get('x-briefing-secret') !== secret) {
    console.warn('generate-briefing-background: rejected request without a valid secret');
    return;
  }

  const started = Date.now();
  try {
    const store = briefingsStore();
    const summary = await generateBriefing(store, { deadline: started + 13 * 60 * 1000 });
    console.log(`Briefing ${summary.date} run finished in ${Math.round((Date.now() - started) / 1000)}s`, JSON.stringify(summary));

    // Send as soon as the edition is ready. The GitHub workflow is a later
    // backup; Buttondown's record of sent emails keeps it to one send a day.
    const today = summary.days[summary.days.length - 1];
    if (context.deploy?.context === 'production' && emailEnabled() && summary.date === utcDate() && today?.published && readyToSend(today)) {
      const day = await store.get(`day/${summary.date}`, { type: 'json' });
      const result = await sendEdition(day, (process.env.URL || 'https://authentic-reader.netlify.app').replace(/\/$/, ''));
      console.log('Email edition:', JSON.stringify(result));
    }
  } catch (error) {
    console.error('Briefing generation failed:', error);
  }
};
