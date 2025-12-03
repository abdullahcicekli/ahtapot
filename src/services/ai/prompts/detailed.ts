/**
 * Detailed Analysis Prompt
 * Comprehensive analysis for SOC L2/L3 and IR teams
 * Target: 800-1200 words, full investigation report
 * Returns: Structured JSON response
 */

export const DETAILED_SYSTEM_PROMPT = `You are a Senior Threat Intelligence Analyst and Incident Responder.

CRITICAL RULES:
1. ALWAYS respond with valid JSON only - no markdown, no explanation outside JSON
2. Use the EXACT field names provided in the schema
3. Evidence-based conclusions with clear confidence levels
4. Include actionable recommendations for IR teams
5. Write all content in the specified language
6. No emojis, no special unicode characters
7. Target 800-1200 words total across all fields
8. Use suggestive tone for all recommendations (e.g., "It would be advisable to..." instead of commands)
9. The copy_markdown field should contain a full investigation report in markdown format`;

export function buildDetailedPrompt(
  iocList: Array<{ type: string; value: string }>,
  analysisData: Record<string, any>,
  language: string = 'en'
): { system: string; user: string } {
  const languageInstruction = getLanguageInstruction(language);
  
  const iocListFormatted = iocList
    .map((ioc) => `- ${ioc.type.toUpperCase()}: ${ioc.value}`)
    .join('\n');

  const userPrompt = `${languageInstruction}

IOCs for comprehensive analysis:
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
  "attack_vector": "attack vector or 'Not applicable'",
  "priority": "P1" | "P2" | "P3" | "P4",
  
  "executive_summary": "4-5 sentences: what was found, why it matters, key risk, primary recommendation",
  
  "ioc_analysis": [
    {
      "indicator": "the IOC value",
      "type": "IOC type",
      "classification": "classification",
      "first_seen": "date or 'Unknown'",
      "last_seen": "date or 'Unknown'",
      "context": "background on the IOC"
    }
  ],
  
  "provider_analysis": [
    {
      "provider": "provider name",
      "result": "finding",
      "confidence_level": "high" | "medium" | "low",
      "key_evidence": "specific data points",
      "source_credibility": "reliability rating"
    }
  ],
  
  "cross_reference": {
    "consensus": "what providers agree on",
    "conflicting_data": "discrepancies between sources",
    "unique_findings": "data only from specific providers",
    "data_quality": "overall reliability assessment"
  },
  
  "threat_intel": {
    "malware_family": "family name or 'Not identified'",
    "threat_actor": "actor name or 'Not identified'",
    "campaign": "campaign name or 'Not identified'",
    "target_sectors": "targeted industries or 'Unknown'"
  },
  
  "infrastructure": {
    "hosting": "hosting provider info",
    "asn_info": "ASN details",
    "geolocation": "location info",
    "registrar": "domain registrar or 'Not applicable'"
  },
  
  "historical": {
    "timeline": "activity history",
    "activity_pattern": "patterns in usage/detection"
  },
  
  "mitre_attack": [
    {
      "tactic": "tactic name",
      "technique": "technique ID and name",
      "procedure": "how technique is used",
      "evidence_level": "high" | "medium" | "low"
    }
  ],
  
  "attack_chain_analysis": "how this IOC fits into potential attack scenarios",
  
  "false_positive": {
    "probability": "high" | "medium" | "low",
    "increasing_factors": ["factor 1", "factor 2"],
    "decreasing_factors": ["factor 1", "factor 2"],
    "similar_legitimate": "known benign uses if any",
    "recommendation": "FP handling suggestion"
  },
  
  "response_actions": {
    "immediate": ["suggestion within 0-1h (use suggestive tone)"],
    "short_term": ["suggestion within 1-24h"],
    "long_term": ["suggestion within 1-7d"],
    "investigation_checklist": ["step 1", "step 2", "step 3"]
  },
  
  "detection_engineering": {
    "suggested_rules": ["rule description or pseudocode"]
  },
  
  "analyst_notes": {
    "confidence_factors": "what affects verdict reliability",
    "limitations": "data gaps, analysis constraints",
    "additional_research": "what would improve analysis"
  },
  
  "references": ["relevant external resources if applicable"],
  
  "copy_markdown": "# IOC Investigation Report\\n\\n## Executive Summary\\n[executive_summary]\\n\\n## Verdict & Risk Assessment\\n| Verdict | Risk Level | Confidence | Priority | Escalation |\\n|---------|------------|------------|----------|------------|\\n| [verdict] | [risk] | [confidence] | [priority] | [escalation] |\\n\\n## IOC Analysis\\n[ioc details]\\n\\n## Provider Analysis\\n[provider table]\\n\\n## Threat Intelligence\\n[threat intel details]\\n\\n## MITRE ATT&CK Mapping\\n[mitre details]\\n\\n## False Positive Analysis\\n[fp analysis]\\n\\n## Response Actions\\n### Immediate\\n[immediate actions]\\n\\n### Short-term\\n[short-term actions]\\n\\n### Long-term\\n[long-term actions]\\n\\n## Detection Engineering\\n[detection rules]\\n\\n## Analyst Notes\\n[notes]\\n\\n## References\\n[references]"
}`;

  return {
    system: DETAILED_SYSTEM_PROMPT,
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
