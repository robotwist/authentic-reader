import { getStore } from '@netlify/blobs';

// BRIEFINGS_STORE lets preview deploys read a separate test store; production
// leaves it unset.
export function briefingsStore() {
  return getStore({ name: process.env.BRIEFINGS_STORE || 'briefings', consistency: 'strong' });
}
