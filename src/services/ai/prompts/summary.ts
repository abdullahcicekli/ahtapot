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
8. The copy_markdown field should contain a well-formatted markdown summary for copying

PRIORITY LEVELS:
- P0 (Critical): Confirmed active threat, system outage risk, immediate action required
- P1 (High): High-risk IOC, major threat indicators, urgent investigation needed
- P2 (Moderate): Suspicious activity, needs prioritized investigation
- P3 (Low): Minor indicators, routine investigation as part of normal workflow
- P4 (Negligible): Minimal risk, can be placed on backlog`;

export function buildSummaryPrompt(
  iocList: Array<{ type: string; value: string }>,
  analysisData: Record<string, any>,
  language: string = 'en'
): { system: string; user: string } {
  const languageInstruction = getLanguageInstruction(language);
  const markdownTemplate = getMarkdownTemplate(language);
  
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
  "priority": "P0" | "P1" | "P2" | "P3" | "P4",
  "summary": "2-3 sentences describing the key finding",
  "key_signals": {
    "detection": "detection ratio or status",
    "reputation": "reputation score/context", 
    "associations": "malware family, threat actor, or none"
  },
  "recommended_action": "single actionable suggestion (use suggestive tone)",
  "copy_markdown": "${markdownTemplate}"
}`;

  return {
    system: SUMMARY_SYSTEM_PROMPT,
    user: userPrompt,
  };
}

function getLanguageInstruction(language: string): string {
  const instructions: Record<string, string> = {
    en: 'IMPORTANT: Write ALL text values in English, including markdown headers and labels.',
    tr: 'ÖNEMLİ: Markdown başlıkları ve etiketleri dahil TÜM metin değerlerini Türkçe olarak yazın.',
    de: 'WICHTIG: Schreiben Sie ALLE Textwerte auf Deutsch, einschließlich Markdown-Überschriften.',
    fr: 'IMPORTANT: Écrivez TOUTES les valeurs textuelles en français, y compris les titres markdown.',
    es: 'IMPORTANTE: Escriba TODOS los valores de texto en español, incluidos los encabezados markdown.',
  };
  return instructions[language] || instructions['en'];
}

function getMarkdownTemplate(language: string): string {
  const templates: Record<string, string> = {
    en: '## IOC Analysis Summary\\n\\n**Verdict:** [verdict]\\n**Risk Level:** [risk]\\n**Confidence:** [confidence]\\n\\n### Summary\\n[summary text]\\n\\n### Key Signals\\n- **Detection:** [detection]\\n- **Reputation:** [reputation]\\n- **Associations:** [associations]\\n\\n### Recommended Action\\n[action]',
    tr: '## IOC Analiz Özeti\\n\\n**Karar:** [verdict]\\n**Risk Seviyesi:** [risk]\\n**Güven:** [confidence]\\n\\n### Özet\\n[summary text]\\n\\n### Temel Sinyaller\\n- **Tespit:** [detection]\\n- **İtibar:** [reputation]\\n- **İlişkiler:** [associations]\\n\\n### Önerilen Eylem\\n[action]',
    de: '## IOC-Analyseübersicht\\n\\n**Urteil:** [verdict]\\n**Risikostufe:** [risk]\\n**Vertrauen:** [confidence]\\n\\n### Zusammenfassung\\n[summary text]\\n\\n### Wichtige Signale\\n- **Erkennung:** [detection]\\n- **Reputation:** [reputation]\\n- **Verbindungen:** [associations]\\n\\n### Empfohlene Maßnahme\\n[action]',
    fr: "## Résumé de l'analyse IOC\\n\\n**Verdict:** [verdict]\\n**Niveau de risque:** [risk]\\n**Confiance:** [confidence]\\n\\n### Résumé\\n[summary text]\\n\\n### Signaux clés\\n- **Détection:** [detection]\\n- **Réputation:** [reputation]\\n- **Associations:** [associations]\\n\\n### Action recommandée\\n[action]",
    es: '## Resumen del análisis IOC\\n\\n**Veredicto:** [verdict]\\n**Nivel de riesgo:** [risk]\\n**Confianza:** [confidence]\\n\\n### Resumen\\n[summary text]\\n\\n### Señales clave\\n- **Detección:** [detection]\\n- **Reputación:** [reputation]\\n- **Asociaciones:** [associations]\\n\\n### Acción recomendada\\n[action]',
  };
  return templates[language] || templates['en'];
}
