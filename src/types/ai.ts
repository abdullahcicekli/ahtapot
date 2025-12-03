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
 * AI Provider Configuration
 */
export interface AIProviderConfig {
  provider: AIProvider;
  modelName: string;
  displayName: string;
  apiKeyUrl: string;
  signupUrl: string;
  pricingUrl: string;
  pricingInfo: {
    input: string;
    output: string;
    note?: string;
  };
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
    modelName: 'claude-sonnet-4-20250514',
    displayName: 'Claude Sonnet 4',
    apiKeyUrl: 'https://console.anthropic.com/settings/keys',
    signupUrl: 'https://console.anthropic.com/',
    pricingUrl: 'https://www.anthropic.com/pricing',
    pricingInfo: {
      input: '$3 / MTok',
      output: '$15 / MTok',
      note: 'Pay as you go - No free tier for API',
    },
  },
  [AIProvider.GEMINI]: {
    provider: AIProvider.GEMINI,
    modelName: 'gemini-2.0-flash',
    displayName: 'Gemini 2.0 Flash',
    apiKeyUrl: 'https://aistudio.google.com/apikey',
    signupUrl: 'https://aistudio.google.com/',
    pricingUrl: 'https://ai.google.dev/pricing',
    pricingInfo: {
      input: '$0.10 / MTok',
      output: '$0.40 / MTok',
      note: 'Free tier: 15 RPM, 1M TPM, 1500 RPD',
    },
  },
  [AIProvider.OPENAI]: {
    provider: AIProvider.OPENAI,
    modelName: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    signupUrl: 'https://platform.openai.com/signup',
    pricingUrl: 'https://openai.com/api/pricing/',
    pricingInfo: {
      input: '$0.15 / MTok',
      output: '$0.60 / MTok',
      note: 'Pay as you go - Credit purchase required',
    },
  },
};

/**
 * Analysis Mode Display Configuration
 */
export const AI_ANALYSIS_MODE_CONFIG: Record<AIAnalysisMode, { icon: string; color: string }> = {
  [AIAnalysisMode.SUMMARY]: {
    icon: '📋',
    color: '#22c55e',
  },
  [AIAnalysisMode.ANALYSIS]: {
    icon: '🔍',
    color: '#3b82f6',
  },
  [AIAnalysisMode.DETAILED]: {
    icon: '📊',
    color: '#8b5cf6',
  },
};

