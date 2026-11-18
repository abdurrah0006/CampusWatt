/**
 * Optional LLM provider (Anthropic Messages API). Only used when LLM_API_KEY is set.
 * It rewrites the recommendation text; priority, action tag and numbers still come from
 * the rule engine so the figures are always grounded in real data.
 * Any failure (network, timeout, invalid output) throws so the caller can fall back.
 */
import { z } from 'zod';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

const outputSchema = z.array(
  z.object({
    roomId: z.string().min(1),
    recommendation: z.string().min(40).max(900),
  }),
).min(1);

function buildPrompt(items) {
  const facts = items.map((i) => ({
    roomId: i.roomId,
    room: `${i.roomName} (${i.roomCode})`,
    building: i.buildingName,
    roomType: i.roomType,
    wasteHoursLast24h: i.wasteHours,
    peakWasteHourLocal: i.peakLabel,
    wastedKwhLast24h: i.wasteKwh,
    estMonthlyKwh: i.monthlySavingsKwh,
    estMonthlyAED: i.monthlySavingsAED,
    likelyCause: i.likelyCause,
    suggestedAction: i.actionTag,
  }));

  return [
    'You are an energy manager at a university campus in the UAE.',
    'For each room below, write a specific, practical recommendation of 2-3 sentences.',
    'Mention the likely cause, one concrete action, and the estimated monthly saving in AED using the numbers given.',
    'Do not invent numbers. Plain text, no markdown.',
    'Respond with ONLY a JSON array of objects: [{"roomId": "...", "recommendation": "..."}].',
    '',
    JSON.stringify(facts, null, 2),
  ].join('\n');
}

function extractJson(text) {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end <= start) throw new Error('LLM response contained no JSON array');
  return JSON.parse(text.slice(start, end + 1));
}

export function createLlmProvider({ apiKey, model, timeoutMs = 5000, fetchImpl = globalThis.fetch }) {
  return {
    name: 'ai',
    async rewrite(items) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetchImpl(ANTHROPIC_URL, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'content-type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model,
            max_tokens: 1500,
            messages: [{ role: 'user', content: buildPrompt(items) }],
          }),
        });
        if (!response.ok) throw new Error(`LLM HTTP ${response.status}`);
        const body = await response.json();
        const text = (body.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
        const parsed = outputSchema.parse(extractJson(text));
        const byRoom = new Map(parsed.map((p) => [p.roomId, p.recommendation.trim()]));
        if (!items.every((i) => byRoom.has(i.roomId))) throw new Error('LLM output missing rooms');
        return byRoom;
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
