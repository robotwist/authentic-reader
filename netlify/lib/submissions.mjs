import { createHash, randomBytes } from 'node:crypto';
import { getStore } from '@netlify/blobs';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL = 254;
const MAX_TEXT = 5000;
const MAX_PER_HOUR = 10;

// Reader submissions are kept apart from the briefing data; blob stores are
// private, so these are readable only through the Netlify API.
export function submissionsStore() {
  return getStore({ name: process.env.SUBMISSIONS_STORE || 'reader-submissions', consistency: 'strong' });
}

const hash = (value) => createHash('sha256').update(value).digest('hex').slice(0, 32);

export function normalizeEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  return email.length <= MAX_EMAIL && EMAIL.test(email) ? email : null;
}

/** Returns an error message, or null when the submission is acceptable. */
export function validateSubmission(kind, body) {
  if (!body || typeof body !== 'object') return 'Invalid request.';
  if (body.website) return 'Invalid request.';
  if (kind === 'subscribe') {
    return normalizeEmail(body.email) ? null : 'Please enter a valid email address.';
  }
  const story = String(body.story || '').trim();
  const message = String(body.message || '').trim();
  if (!story || !message) return 'Please fill in the story and what is wrong.';
  if (story.length > MAX_TEXT || message.length > MAX_TEXT) return 'That message is too long.';
  if (body.email && !normalizeEmail(body.email)) return 'Please enter a valid email address, or leave it blank.';
  return null;
}

/** Counts requests per visitor per hour; true when the visitor is over the limit. */
export async function overRateLimit(store, ip) {
  const hour = new Date().toISOString().slice(0, 13);
  const key = `ratelimit/${hour}/${hash(ip || 'unknown')}`;
  const count = ((await store.get(key, { type: 'json' })) || 0) + 1;
  await store.setJSON(key, count);
  return count > MAX_PER_HOUR;
}

/** Saves the address once; `emailService` records whether it reached the email service. */
export async function saveSubscriber(store, email, emailService = 'pending') {
  const key = `subscribers/${hash(email)}`;
  const existing = await store.get(key, { type: 'json' });
  if (existing && (existing.emailService === 'added' || emailService === 'pending')) return;
  await store.setJSON(key, { email, createdAt: existing?.createdAt || new Date().toISOString(), emailService });
}

export async function saveReport(store, { story, message, email }) {
  const key = `reports/${new Date().toISOString()}-${randomBytes(4).toString('hex')}`;
  await store.setJSON(key, {
    story: String(story).trim(),
    message: String(message).trim(),
    email: normalizeEmail(email),
    createdAt: new Date().toISOString()
  });
}
