/**
 * AI Provider Types and Interfaces
 * Defines types for AI-powered IOC analysis
 */

/**
 * Supported AI Providers
 */
export enum AIProvider {
  CLAUDE = 'claude',
  GEMINI = 'gemini',
  OPENAI = 'openai',
}

/**
 * AI Analysis Modes
 */
export enum AIAnalysisMode {
  SUMMARY = 'summary',
  ANALYSIS = 'analysis',
  DETAILED = 'detailed',
}

/**
 * Model tiers: every provider ships exactly three, low → mid → high.
 */
export type AIModelTier = 'low' | 'mid' | 'high';

/**
 * Model Configuration
 */
export interface AIModelConfig {
  id: string;
  name: string;
  displayName: string;
  tier: AIModelTier;
  pricing: string;
  recommended?: boolean;
  /* i18n suffix under ai.modelNotes.* shown when this model is selected */
  noteKey?: string;
}

/**
 * AI Provider Configuration
 */
export interface AIProviderConfig {
  provider: AIProvider;
  modelName: string;
  displayName: string;
  shortName: string;
  logo: string;
  apiKeyUrl: string;
  signupUrl: string;
  pricingUrl: string;
  pricingInfo: {
    input: string;
    output: string;
    note?: string;
  };
  models: AIModelConfig[];
}

/**
 * AI Analysis Request
 */
export interface AIAnalysisRequest {
  provider: AIProvider;
  mode: AIAnalysisMode;
  iocData: Record<string, any>;
  iocList: Array<{ type: string; value: string }>;
}

/**
 * AI Analysis Result
 */
export interface AIAnalysisResult {
  provider: AIProvider;
  mode: AIAnalysisMode;
  content: string;
  timestamp: number;
  error?: string;
  tokensUsed?: {
    input: number;
    output: number;
    total: number;
  };
}

/**
 * AI API Key Data (extends base APIKeyData pattern)
 */
export interface AIKeyData {
  key: string;
  addedAt: number;
}

/**
 * AI Provider Display Configuration
 */
export const AI_PROVIDER_CONFIGS: Record<AIProvider, AIProviderConfig> = {
  [AIProvider.CLAUDE]: {
    provider: AIProvider.CLAUDE,
    modelName: 'claude-opus-5',
    displayName: 'Anthropic',
    shortName: 'Anthropic',
    logo: '/provider-icons/claude-logo.png',
    apiKeyUrl: 'https://console.anthropic.com/settings/keys',
    signupUrl: 'https://console.anthropic.com/',
    pricingUrl: 'https://www.anthropic.com/pricing',
    pricingInfo: {
      input: '$1–10 / MTok',
      output: '$5–50 / MTok',
      note: 'Pay as you go - No free tier for API',
    },
    models: [
      { id: 'claude-haiku-4-5', name: 'haiku-4.5', displayName: 'Claude Haiku 4.5', tier: 'low', pricing: '$1 / $5 MTok' },
      { id: 'claude-opus-5', name: 'opus-5', displayName: 'Claude Opus 5', tier: 'mid', pricing: '$5 / $25 MTok', recommended: true },
      { id: 'claude-fable-5', name: 'fable-5', displayName: 'Claude Fable 5', tier: 'high', pricing: '$10 / $50 MTok', noteKey: 'fable' },
    ],
  },
  [AIProvider.GEMINI]: {
    provider: AIProvider.GEMINI,
    modelName: 'gemini-3.7-flash',
    displayName: 'Google',
    shortName: 'Google',
    logo: '/provider-icons/gemini-logo.png',
    apiKeyUrl: 'https://aistudio.google.com/apikey',
    signupUrl: 'https://aistudio.google.com/',
    pricingUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
    pricingInfo: {
      input: '$0.30–2 / MTok',
      output: '$2.50–12 / MTok',
      note: 'Free tier available in AI Studio',
    },
    models: [
      { id: 'gemini-3.5-flash-lite', name: 'gemini-3.5-flash-lite', displayName: 'Gemini 3.5 Flash-Lite', tier: 'low', pricing: '$0.30 / $2.50 MTok' },
      { id: 'gemini-3.7-flash', name: 'gemini-3.7-flash', displayName: 'Gemini 3.7 Flash', tier: 'mid', pricing: '$0.75 / $3.75 MTok', recommended: true },
      { id: 'gemini-3.1-pro-preview', name: 'gemini-3.1-pro', displayName: 'Gemini 3.1 Pro', tier: 'high', pricing: '$2 / $12 MTok' },
    ],
  },
  [AIProvider.OPENAI]: {
    provider: AIProvider.OPENAI,
    modelName: 'gpt-5.6-terra',
    displayName: 'OpenAI',
    shortName: 'OpenAI',
    logo: '/provider-icons/openai-logo.svg',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    signupUrl: 'https://platform.openai.com/signup',
    pricingUrl: 'https://openai.com/api/pricing/',
    pricingInfo: {
      input: '$0.20–5 / MTok',
      output: '$1.20–30 / MTok',
      note: 'Pay as you go - Credit purchase required',
    },
    models: [
      { id: 'gpt-5.6-luna', name: 'gpt-5.6-luna', displayName: 'GPT-5.6 Luna', tier: 'low', pricing: '$0.20 / $1.20 MTok' },
      { id: 'gpt-5.6-terra', name: 'gpt-5.6-terra', displayName: 'GPT-5.6 Terra', tier: 'mid', pricing: '$2 / $12 MTok', recommended: true },
      { id: 'gpt-5.6-sol', name: 'gpt-5.6-sol', displayName: 'GPT-5.6 Sol', tier: 'high', pricing: '$5 / $30 MTok' },
    ],
  },
};

/**
 * Analysis Mode Display Configuration
 */
export const AI_ANALYSIS_MODE_CONFIG: Record<AIAnalysisMode, { icon: string; color: string }> = {
  [AIAnalysisMode.SUMMARY]: {
    icon: '📋',
    color: '#4ADE80', // success green
  },
  [AIAnalysisMode.ANALYSIS]: {
    icon: '🔍',
    color: '#38BDF8', // info blue
  },
  [AIAnalysisMode.DETAILED]: {
    icon: '📊',
    color: '#A78BFA', // purple
  },
};

