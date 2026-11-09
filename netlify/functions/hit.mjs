import { isBot, parseHit, recordHit, statsStore } from '../lib/stats.mjs';
import { utcDate } from '../lib/sources.mjs';

export default async (req, context) => {
  const accepted = new Response(null, { status: 204 });
  if (req.method !== 'POST') return new Response(null, { status: 405 });
  // Only the production site counts; previews and bots are ignored.
  if (context.deploy?.context !== 'production' || isBot(req.headers.get('user-agent'))) return accepted;

  let hit;
  try {
    hit = parseHit(await req.json());
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!hit) return new Response(null, { status: 400 });

  try {
    await recordHit(statsStore(), utcDate(), hit);
  } catch (error) {
    console.warn('Could not record visit:', error.message);
  }
  return accepted;
};

export const config = {
  path: '/api/hit'
};
