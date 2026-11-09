import { API_CONFIG } from '../config/api.config';

/** Sends a reader submission to /api/subscribe or /api/report and throws with a readable message on failure. */
export async function submitForm(endpoint: 'subscribe' | 'report', fields: Record<string, string>) {
  const response = await fetch(`${API_CONFIG.BASE_URL}/api/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) throw new Error(data.error || 'That did not go through. Please try again.');
}
