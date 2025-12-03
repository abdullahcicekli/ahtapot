/**
 * AI Prompts Index
 * Central export for all analysis prompts
 */

export { buildSummaryPrompt, SUMMARY_SYSTEM_PROMPT, SUMMARY_USER_PROMPT } from './summary';
export { buildAnalysisPrompt, ANALYSIS_SYSTEM_PROMPT, ANALYSIS_USER_PROMPT } from './analysis';
export { buildDetailedPrompt, DETAILED_SYSTEM_PROMPT, DETAILED_USER_PROMPT } from './detailed';

import { AIAnalysisMode } from '@/types/ai';
import { buildSummaryPrompt } from './summary';
import { buildAnalysisPrompt } from './analysis';
import { buildDetailedPrompt } from './detailed';

/**
 * Build prompt based on analysis mode
 */
export function buildPromptForMode(
  mode: AIAnalysisMode,
  iocList: Array<{ type: string; value: string }>,
  analysisData: Record<string, any>
): { system: string; user: string } {
  switch (mode) {
    case AIAnalysisMode.SUMMARY:
      return buildSummaryPrompt(iocList, analysisData);
    case AIAnalysisMode.ANALYSIS:
      return buildAnalysisPrompt(iocList, analysisData);
    case AIAnalysisMode.DETAILED:
      return buildDetailedPrompt(iocList, analysisData);
    default:
      return buildSummaryPrompt(iocList, analysisData);
  }
}

