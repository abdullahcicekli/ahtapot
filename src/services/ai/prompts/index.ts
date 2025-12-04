/**
 * AI Prompts Index
 * Central export for all analysis prompts
 */

export { buildSummaryPrompt, SUMMARY_SYSTEM_PROMPT } from './summary';
export { buildAnalysisPrompt, ANALYSIS_SYSTEM_PROMPT } from './analysis';
export { buildDetailedPrompt, DETAILED_SYSTEM_PROMPT } from './detailed';

import { AIAnalysisMode } from '@/types/ai';
import { buildSummaryPrompt } from './summary';
import { buildAnalysisPrompt } from './analysis';
import { buildDetailedPrompt } from './detailed';

/**
 * Build prompt based on analysis mode
 * @param mode - The analysis mode (summary, analysis, detailed)
 * @param iocList - List of IOCs to analyze
 * @param analysisData - Analysis results from providers
 * @param language - Output language code (e.g., 'en', 'tr')
 */
export function buildPromptForMode(
  mode: AIAnalysisMode,
  iocList: Array<{ type: string; value: string }>,
  analysisData: Record<string, any>,
  language: string = 'en'
): { system: string; user: string } {
  switch (mode) {
    case AIAnalysisMode.SUMMARY:
      return buildSummaryPrompt(iocList, analysisData, language);
    case AIAnalysisMode.ANALYSIS:
      return buildAnalysisPrompt(iocList, analysisData, language);
    case AIAnalysisMode.DETAILED:
      return buildDetailedPrompt(iocList, analysisData, language);
    default:
      return buildSummaryPrompt(iocList, analysisData, language);
  }
}
