import readline from 'node:readline';
import { addCorrection } from '../netlify/lib/record.mjs';

/** A question prompt that keeps answers typed (or piped) ahead of the question. Returns null at end of input. */
export function createAsk() {
  const rl = readline.createInterface({ input: process.stdin, terminal: process.stdin.isTTY });
  const lines = rl[Symbol.asyncIterator]();
  const ask = async (question) => {
    process.stdout.write(question);
    const { value, done } = await lines.next();
    if (!process.stdin.isTTY) process.stdout.write(`${done ? '' : value}\n`);
    return done ? null : value;
  };
  return { ask, close: () => rl.close() };
}

/** Asks for a correction's details, confirms, and publishes it. Returns the entry, or null if cancelled. */
export async function promptCorrection(ask, store, defaults = {}) {
  let editionDate = defaults.editionDate;
  while (!/^\d{4}-\d{2}-\d{2}$/.test(editionDate || '')) {
    const answer = await ask('Edition date (YYYY-MM-DD): ');
    if (answer === null) return null;
    editionDate = answer.trim();
  }

  let story = defaults.story;
  let title = defaults.title;
  if (!story) {
    const day = await store.get(`day/${editionDate}`, { type: 'json' });
    if (!day) {
      console.log(`No edition found for ${editionDate}.`);
      return null;
    }
    const keys = day.order || Object.keys(day.topics);
    keys.forEach((key, i) => console.log(`  ${i + 1}. ${day.topics[key].topic}: ${day.topics[key].article.title}`));
    const choice = Number((await ask('Which story? (number): '))?.trim());
    story = keys[choice - 1];
    if (!story) return null;
    title = day.topics[story].topic;
  }

  const wrong = (await ask(`What was wrong${defaults.wrong ? ` [${defaults.wrong}]` : ''}: `))?.trim() || defaults.wrong;
  const corrected = (await ask('The correction, as readers will see it: '))?.trim();
  if (!wrong || !corrected) {
    console.log('Cancelled: both lines are needed.');
    return null;
  }
  console.log(`\n  ${title} (${editionDate})\n  Wrong: ${wrong}\n  Correction: ${corrected}\n`);
  if (!/^y/i.test((await ask('Publish this correction? [y/N]: ')) || '')) return null;

  const entry = await addCorrection(store, { date: new Date().toISOString().slice(0, 10), editionDate, story, title, wrong, corrected });
  console.log('Published. It appears on /corrections and on the story within about ten minutes.');
  return entry;
}
