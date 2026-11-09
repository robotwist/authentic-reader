const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Each Groq model has its own daily token quota, so falling back to the next
// model lets a run finish when the preferred one is used up. Only the gpt-oss
// models support the browser_search tool used for fact-checking.
const list = (value, fallback) => (value || fallback).split(',').map((m) => m.trim()).filter(Boolean);

/** Thrown when Groq's per-day quota is used up for every model in a chain. */
export class DailyLimitError extends Error {}

/** Per-run state shared by every model call: token usage and models out of quota. */
export function createAiContext() {
  const totals = {};
  const exhausted = new Set();
  return {
    analysisModels: list(process.env.GROQ_MODELS, 'openai/gpt-oss-120b,qwen/qwen3.8-27b,openai/gpt-oss-20b'),
    searchModels: list(process.env.GROQ_SEARCH_MODELS, 'openai/gpt-oss-20b,openai/gpt-oss-120b'),
    exhausted,
    tokens: totals,
    addUsage(model, usage) { totals[model] = (totals[model] || 0) + (usage?.total_tokens || 0); },
    canUse(models) { return models.some((m) => !exhausted.has(m)); }
  };
}

function parseJsonLoose(text) {
  const cleaned = String(text).replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Model response contained no JSON object');
    return JSON.parse(match[0]);
  }
}

class ModelDailyLimit extends Error {}
class ModelUnavailable extends Error {}

// Facts newer than the models' training data that they otherwise get wrong.
// Override with the CURRENT_CONTEXT env var when they change.
const DEFAULT_CURRENT_CONTEXT = 'Donald Trump has been President of the United States since January 20, 2025 (his second term); JD Vance is Vice President.';

export function currentFacts() {
  return process.env.CURRENT_CONTEXT || DEFAULT_CURRENT_CONTEXT;
}

async function callModel(model, { system, user, maxTokens, reasoningEffort, tools }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set');

  const body = {
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    temperature: 0.2,
    max_completion_tokens: maxTokens
  };
  // Groq rejects JSON mode combined with built-in tools, so tool calls are parsed loosely instead.
  if (tools) {
    body.tools = tools;
    body.tool_choice = 'auto';
  } else {
    body.response_format = { type: 'json_object' };
  }
  if (model.startsWith('openai/gpt-oss')) body.reasoning_effort = reasoningEffort;

  for (let attempt = 1; attempt <= 5; attempt++) {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(180000)
    });

    if (response.status === 429 || response.status >= 500) {
      const errorText = await response.text();
      if (/per day/i.test(errorText)) throw new ModelDailyLimit(model);
      const retryAfter = Number(response.headers.get('retry-after'));
      const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : attempt * 15000;
      console.warn(`[briefing] Groq ${response.status} on ${model}, retrying in ${Math.round(waitMs / 1000)}s (attempt ${attempt})`);
      await new Promise((resolve) => setTimeout(resolve, Math.min(waitMs, 90000)));
      continue;
    }

    const data = await response.json();
    if (response.status === 400 && /failed to generate json/i.test(data?.error?.message || '')) {
      throw new ModelUnavailable(`${model} produced invalid JSON`);
    }
    if (!response.ok) throw new Error(`Groq ${response.status} on ${model}: ${data?.error?.message || 'unknown error'}`);
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new ModelUnavailable(`${model} returned an empty response`);
    try {
      return { json: parseJsonLoose(content), usage: data.usage };
    } catch {
      throw new ModelUnavailable(`${model} returned unparseable JSON`);
    }
  }
  throw new ModelUnavailable(`Groq rate limit retries exhausted on ${model}`);
}

/**
 * Calls the first model in the chain that still has daily quota and returns
 * parsed JSON. Defaults to the search chain when tools are passed.
 */
export async function callGroqJson({ system, user, maxTokens = 8000, reasoningEffort = 'low', tools, ai, models }) {
  const chain = models || (tools ? ai.searchModels : ai.analysisModels);
  let lastTransient = null;
  for (const model of chain) {
    if (ai.exhausted.has(model)) continue;
    try {
      const { json, usage } = await callModel(model, { system, user, maxTokens, reasoningEffort, tools });
      ai.addUsage(model, usage);
      return { json, model };
    } catch (error) {
      if (error instanceof ModelDailyLimit) {
        console.warn(`[briefing] Daily limit reached for ${model}, trying the next model`);
        ai.exhausted.add(model);
      } else if (error instanceof ModelUnavailable) {
        console.warn(`[briefing] ${error.message}, trying the next model`);
        lastTransient = error;
      } else {
        throw error;
      }
    }
  }
  if (lastTransient) throw new Error(`No model could complete the request: ${lastTransient.message}`);
  throw new DailyLimitError(`Daily limit reached for every model in: ${chain.join(', ')}`);
}
