/**
 * Live AI API key testing.
 * Each provider exposes a free "list models" endpoint, so a key can be
 * verified with a real authenticated request that costs no tokens.
 */

import { AIProvider } from '@/types/ai';

export interface AIKeyTestResult {
  ok: boolean;
  error?: string;
}

async function describeFailure(response: Response, provider: string): Promise<string> {
  if (response.status === 401 || response.status === 403) {
    return 'Invalid API key';
  }
  if (response.status === 429) {
    return 'Rate limited - key looks valid, try again shortly';
  }
  const data = await response.json().catch(() => ({}));
  return (
    data?.error?.message ||
    `${provider} API error: ${response.status}`
  );
}

export async function testAIKey(provider: AIProvider, key: string): Promise<AIKeyTestResult> {
  const trimmed = key.trim();
  if (!trimmed) return { ok: false, error: 'API key is required' };

  try {
    switch (provider) {
      case AIProvider.CLAUDE: {
        const response = await fetch('https://api.anthropic.com/v1/models', {
          headers: {
            'x-api-key': trimmed,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
        });
        if (!response.ok) return { ok: false, error: await describeFailure(response, 'Anthropic') };
        return { ok: true };
      }
      case AIProvider.OPENAI: {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${trimmed}` },
        });
        if (!response.ok) return { ok: false, error: await describeFailure(response, 'OpenAI') };
        return { ok: true };
      }
      case AIProvider.GEMINI: {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(trimmed)}`,
        );
        if (!response.ok) return { ok: false, error: await describeFailure(response, 'Google') };
        return { ok: true };
      }
      default:
        return { ok: false, error: 'Unsupported provider' };
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}
