/**
 * Analysis Prompt
 * Medium-depth analysis for SOC L1/L2 analysts
 * Target: 400-600 words, triage decision and escalation context
 * Returns: Structured JSON response
 */

export const ANALYSIS_SYSTEM_PROMPT = `You are a Senior SOC Analyst specializing in IOC triage and threat assessment.

CRITICAL RULES:
1. ALWAYS respond with valid JSON only - no markdown, no explanation outside JSON
2. Use the EXACT field names provided in the schema
3. Evidence-based conclusions with clear reasoning
4. Write all content in the specified language
5. No emojis, no special unicode characters
6. Target 400-600 words total across all fields
7. Use suggestive tone for recommendations (e.g., "It is recommended to..." instead of "Do this immediately")
8. The copy_markdown field should contain a comprehensive markdown report for copying`;

export function buildAnalysisPrompt(
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
  "escalation_required": true | false,
  
  "assessment_summary": "3-4 sentences: main finding, verdict reasoning, key evidence",
  
  "provider_analysis": [
    {
      "provider": "provider name",
      "verdict": "provider's verdict or score",
      "key_finding": "most important finding from this provider"
    }
  ],
  
  "consensus": {
    "agreement": "what providers agree on",
    "conflicts": "differing results if any, or 'None'",
    "data_gaps": "missing data areas"
  },
  
  "threat_intel": {
    "known_associations": "malware family, threat actor, campaign or 'None identified'",
    "historical_activity": "first/last seen, activity timeline",
    "infrastructure": "hosting, ASN, geolocation for IPs"
  },
  
  "false_positive_indicators": ["factor 1", "factor 2"],
  
  "mitre_attack": [
    {
      "tactic": "tactic name",
      "technique": "technique ID and name",
      "relevance": "how this IOC relates"
    }
  ],
  
  "recommended_actions": {
    "immediate": ["most urgent suggestion (use suggestive tone)"],
    "short_term": ["follow-up suggestions within 24h"],
    "investigation_steps": ["step 1", "step 2"]
  },
  
  "analyst_notes": {
    "confidence_factors": "what affects verdict reliability",
    "limitations": "analysis constraints, missing data",
    "follow_up": "additional info needed"
  },
  
  "copy_markdown": "## IOC Analysis Report\\n\\n**Verdict:** [verdict] | **Risk:** [risk] | **Confidence:** [confidence]\\n\\n### Assessment Summary\\n[summary]\\n\\n### Provider Analysis\\n| Provider | Verdict | Key Finding |\\n|----------|---------|-------------|\\n[table rows]\\n\\n### Threat Intelligence\\n- **Associations:** [associations]\\n- **Historical:** [historical]\\n- **Infrastructure:** [infrastructure]\\n\\n### MITRE ATT&CK\\n[mitre mappings]\\n\\n### Recommended Actions\\n**Immediate:**\\n[immediate actions]\\n\\n**Short-term:**\\n[short-term actions]\\n\\n### Analyst Notes\\n[notes]"
}`;

  return {
    system: ANALYSIS_SYSTEM_PROMPT,
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
