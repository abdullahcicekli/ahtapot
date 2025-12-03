/**
 * AI Service
 * Handles AI-powered IOC analysis using multiple providers
 */

import { AIProvider, AIAnalysisMode, AIAnalysisResult, AI_PROVIDER_CONFIGS } from '@/types/ai';
import { IOCAnalysisResult } from '@/types/ioc';
import { buildPromptForMode } from './prompts';

/**
 * Base AI Service class
 */
export class AIService {
  private apiKey: string;
  private provider: AIProvider;

  constructor(provider: AIProvider, apiKey: string) {
    this.provider = provider;
    this.apiKey = apiKey;
  }

  /**
   * Analyze IOC results using AI
   */
  async analyze(
    mode: AIAnalysisMode,
    iocList: Array<{ type: string; value: string }>,
    analysisResults: IOCAnalysisResult[]
  ): Promise<AIAnalysisResult> {
    // Build analysis data from results
    const analysisData = this.buildAnalysisData(analysisResults);

    // Build prompts
    const { system, user } = buildPromptForMode(mode, iocList, analysisData);

    try {
      // Call the appropriate AI provider
      const content = await this.callAI(system, user);

      return {
        provider: this.provider,
        mode,
        content,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(`[AIService] Error analyzing with ${this.provider}:`, error);
      return {
        provider: this.provider,
        mode,
        content: '',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Build analysis data from IOC results
   */
  private buildAnalysisData(results: IOCAnalysisResult[]): Record<string, any> {
    const data: Record<string, any> = {};

    results.forEach((result) => {
      const providerKey = result.source.toLowerCase().replace(/\s+/g, '_');

      if (!data[providerKey]) {
        data[providerKey] = [];
      }

      data[providerKey].push({
        ioc: {
          type: result.ioc.type,
          value: result.ioc.value,
        },
        status: result.status,
        details: result.details,
        error: result.error,
      });
    });

    return data;
  }

  /**
   * Call AI provider API
   */
  private async callAI(systemPrompt: string, userPrompt: string): Promise<string> {
    switch (this.provider) {
      case AIProvider.CLAUDE:
        return this.callClaude(systemPrompt, userPrompt);
      case AIProvider.GEMINI:
        return this.callGemini(systemPrompt, userPrompt);
      case AIProvider.OPENAI:
        return this.callOpenAI(systemPrompt, userPrompt);
      default:
        throw new Error(`Unsupported AI provider: ${this.provider}`);
    }
  }

  /**
   * Call Claude API (Anthropic)
   */
  private async callClaude(systemPrompt: string, userPrompt: string): Promise<string> {
    const config = AI_PROVIDER_CONFIGS[AIProvider.CLAUDE];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: config.modelName,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Claude API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || '';
  }

  /**
   * Call Gemini API (Google)
   */
  private async callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
    const config = AI_PROVIDER_CONFIGS[AIProvider.GEMINI];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.modelName}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 4096,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
    const config = AI_PROVIDER_CONFIGS[AIProvider.OPENAI];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: config.modelName,
        max_tokens: 4096,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}

/**
 * Create AI service instance
 */
export function createAIService(provider: AIProvider, apiKey: string): AIService {
  return new AIService(provider, apiKey);
}

