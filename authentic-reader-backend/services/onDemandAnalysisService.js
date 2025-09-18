import axios from 'axios';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

function basicSummary(text, maxSentences = 3) {
  if (!text) return '';
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
  return sentences.slice(0, maxSentences).join(' ').trim();
}

function basicSentiment(text) {
  if (!text) return { score: 0, label: 'neutral' };
  const positives = ['good', 'great', 'positive', 'benefit', 'success'];
  const negatives = ['bad', 'poor', 'negative', 'fail', 'crisis', 'fear'];
  const lower = text.toLowerCase();
  let score = 0;
  for (const w of positives) if (lower.includes(w)) score += 1;
  for (const w of negatives) if (lower.includes(w)) score -= 1;
  const label = score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral';
  return { score, label };
}

function extractEntities(text) {
  if (!text) return [];
  const words = Array.from(new Set(text.match(/[A-Z][a-zA-Z]{2,}/g) || [])).slice(0, 20);
  return words.map((w) => ({ name: w, count: 1 }));
}

export async function fetchAndExtract(url) {
  const rsp = await axios.get(url, { timeout: 10000 });
  const dom = new JSDOM(rsp.data, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();
  return article?.textContent || '';
}

export async function analyzeArticle({ title, url, content }) {
  let text = content;
  if (!text && url) {
    try {
      text = await fetchAndExtract(url);
    } catch (e) {
      text = '';
    }
  }
  const summary = basicSummary(text, 3);
  const sentiment = basicSentiment(text);
  const entities = extractEntities(text);
  const biasIndicators = {
    sensationalist: /shocking|outrage|breaking/i.test(text)
  };
  const credibility = {
    score: Math.max(0, Math.min(1, (text?.length || 0) / 5000)),
    level: (text?.length || 0) > 1500 ? 'medium' : 'low'
  };
  return {
    generatedAt: new Date().toISOString(),
    title,
    url,
    summary,
    sentiment,
    entities,
    biasIndicators,
    credibility
  };
}


