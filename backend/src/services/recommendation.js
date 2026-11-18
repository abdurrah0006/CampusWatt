import { ruleBasedProvider } from './providers/ruleBasedProvider.js';
import { createLlmProvider } from './providers/llmProvider.js';
import { formatHourLabel } from '../utils/dateHelpers.js';
import { logger } from '../utils/logger.js';

/**
 * Provider pattern:
 *  1. Rule-based engine always runs first (instant, offline, never fails).
 *  2. If an LLM key is configured, the LLM rewrites the text. On any error or timeout
 *     the rule-based text is returned unchanged - the user never sees an error.
 * Response carries source: "ai" | "rule-based".
 */
export async function generateRecommendations(factsList, { llmApiKey, llmModel, llmTimeoutMs, fetchImpl } = {}) {
  const base = await ruleBasedProvider.generate(factsList);

  if (!llmApiKey || base.length === 0) {
    return { source: 'rule-based', items: base, fallbackReason: null };
  }

  try {
    const provider = createLlmProvider({ apiKey: llmApiKey, model: llmModel, timeoutMs: llmTimeoutMs, fetchImpl });
    const enriched = base.map((b, i) => ({
      ...factsList[i],
      ...b,
      peakLabel: factsList[i].peakHour !== null && factsList[i].peakHour !== undefined ? formatHourLabel(factsList[i].peakHour) : 'after hours',
    }));
    const texts = await provider.rewrite(enriched);
    return {
      source: 'ai',
      items: base.map((b) => ({ ...b, recommendation: texts.get(b.roomId) })),
      fallbackReason: null,
    };
  } catch (err) {
    const reason = err.name === 'AbortError' ? 'timeout' : err.message;
    logger.warn(`LLM provider failed (${reason}). Using rule-based recommendations.`);
    return { source: 'rule-based', items: base, fallbackReason: 'llm_unavailable' };
  }
}
