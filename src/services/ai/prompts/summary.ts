/**
 * Summary Analysis Prompt
 * Quick triage support for SOC L1/L2 analysts
 * Target: ~200 words, readable in 10 seconds
 * Returns: Structured JSON response
 */

export const SUMMARY_SYSTEM_PROMPT = `You are a SOC Triage Assistant. Provide rapid IOC assessments in JSON format.

CRITICAL RULES:
1. ALWAYS respond with valid JSON only - no markdown, no explanation outside JSON
2. Use the EXACT field names provided in the schema
3. All string values must be concise and actionable
4. Write all content in the specified language
5. No emojis, no special unicode characters
6. Maximum 200 words total across all fields
7. Use suggestive tone for recommendations (e.g., "You should consider..." instead of "Do this immediately")
8. The copy_markdown field should contain a well-formatted markdown summary for copying`;

export function buildSummaryPrompt(
  iocList: Array<{ type: string; value: string }>,
  analysisData: Record<string, any>,
  language: string = 'en'
): { system: string; user: string } {
  const languageInstruction = getLanguageInstruction(language);
  
  const iocListFormatted = iocList
    .map((ioc) => `- ${ioc.type.toUpperCase()}: ${ioc.value}`)
    .join('\n');

  const userPrompt = `${languageInstruction}

IOCs to analyze:
${iocListFormatted}

Provider Data:
\`\`\`json
${JSON.stringify(analysisData, null, 2)}
\`\`\`

Respond with this EXACT JSON structure (no other text):

{
  "verdict": "malicious" | "suspicious" | "likely_benign" | "clean" | "unknown",
  "risk_level": "critical" | "high" | "medium" | "low" | "info",
  "confidence": "high" | "medium" | "low",
  "summary": "2-3 sentences describing the key finding",
  "key_signals": {
    "detection": "detection ratio or status",
    "reputation": "reputation score/context", 
    "associations": "malware family, threat actor, or none"
  },
  "recommended_action": "single actionable suggestion (use suggestive tone)",
  "copy_markdown": "## IOC Analysis Summary\\n\\n**Verdict:** [verdict]\\n**Risk Level:** [risk]\\n**Confidence:** [confidence]\\n\\n### Summary\\n[summary text]\\n\\n### Key Signals\\n- **Detection:** [detection]\\n- **Reputation:** [reputation]\\n- **Associations:** [associations]\\n\\n### Recommended Action\\n[action]"
}`;

  return {
    system: SUMMARY_SYSTEM_PROMPT,
    user: userPrompt,
  };
}

function getLanguageInstruction(language: string): string {
  const instructions: Record<string, string> = {
    en: 'IMPORTANT: Write ALL text values in English.',
    tr: 'ÖNEMLİ: TÜM metin değerlerini Türkçe olarak yazın.',
    de: 'WICHTIG: Schreiben Sie ALLE Textwerte auf Deutsch.',
    fr: 'IMPORTANT: Écrivez TOUTES les valeurs textuelles en français.',
    es: 'IMPORTANTE: Escriba TODOS los valores de texto en español.',
  };
  return instructions[language] || instructions['en'];
}
