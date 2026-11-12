// Publishes a correction to a story.
//   npm run correction
import { siteStore } from './site-store.mjs';
import { createAsk, promptCorrection } from './correction-prompt.mjs';

const store = siteStore(process.env.BRIEFINGS_STORE || 'briefings');
const { ask, close } = createAsk();
try {
  await promptCorrection(ask, store);
} finally {
  close();
}
