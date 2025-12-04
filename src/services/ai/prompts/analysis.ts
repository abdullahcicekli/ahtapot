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
8. The copy_markdown field should contain a comprehensive markdown report for copying

PRIORITY LEVELS:
- P0 (Critical): Confirmed active threat, system outage risk, immediate action required
- P1 (High): High-risk IOC, major threat indicators, urgent investigation needed
- P2 (Moderate): Suspicious activity, needs prioritized investigation
- P3 (Low): Minor indicators, routine investigation as part of normal workflow
- P4 (Negligible): Minimal risk, can be placed on backlog`;

export function buildAnalysisPrompt(
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
    "limitations": "analysis constraints, missing data",
    "follow_up": "additional info needed"
  },
  
  "copy_markdown": "${markdownTemplate}"
}`;

  return {
    system: ANALYSIS_SYSTEM_PROMPT,
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
    en: '## IOC Analysis Report\\n\\n**Verdict:** [verdict] | **Risk:** [risk] | **Confidence:** [confidence]\\n\\n### Assessment Summary\\n[summary]\\n\\n### Provider Analysis\\n| Provider | Verdict | Key Finding |\\n|----------|---------|-------------|\\n[table rows]\\n\\n### Threat Intelligence\\n- **Associations:** [associations]\\n- **Historical:** [historical]\\n- **Infrastructure:** [infrastructure]\\n\\n### MITRE ATT&CK\\n[mitre mappings]\\n\\n### Recommended Actions\\n**Immediate:**\\n[immediate actions]\\n\\n**Short-term:**\\n[short-term actions]\\n\\n### Analyst Notes\\n[notes]',
    tr: '## IOC Analiz Raporu\\n\\n**Karar:** [verdict] | **Risk:** [risk] | **Güven:** [confidence]\\n\\n### Değerlendirme Özeti\\n[summary]\\n\\n### Sağlayıcı Analizi\\n| Sağlayıcı | Karar | Temel Bulgu |\\n|-----------|-------|-------------|\\n[table rows]\\n\\n### Tehdit İstihbaratı\\n- **İlişkiler:** [associations]\\n- **Geçmiş:** [historical]\\n- **Altyapı:** [infrastructure]\\n\\n### MITRE ATT&CK\\n[mitre mappings]\\n\\n### Önerilen Eylemler\\n**Acil:**\\n[immediate actions]\\n\\n**Kısa Vadeli:**\\n[short-term actions]\\n\\n### Analist Notları\\n[notes]',
    de: '## IOC-Analysebericht\\n\\n**Urteil:** [verdict] | **Risiko:** [risk] | **Vertrauen:** [confidence]\\n\\n### Bewertungszusammenfassung\\n[summary]\\n\\n### Anbieteranalyse\\n| Anbieter | Urteil | Hauptergebnis |\\n|----------|--------|---------------|\\n[table rows]\\n\\n### Bedrohungsintelligenz\\n- **Verbindungen:** [associations]\\n- **Verlauf:** [historical]\\n- **Infrastruktur:** [infrastructure]\\n\\n### MITRE ATT&CK\\n[mitre mappings]\\n\\n### Empfohlene Maßnahmen\\n**Sofort:**\\n[immediate actions]\\n\\n**Kurzfristig:**\\n[short-term actions]\\n\\n### Analysten-Notizen\\n[notes]',
    fr: "## Rapport d'analyse IOC\\n\\n**Verdict:** [verdict] | **Risque:** [risk] | **Confiance:** [confidence]\\n\\n### Résumé de l'évaluation\\n[summary]\\n\\n### Analyse des fournisseurs\\n| Fournisseur | Verdict | Résultat clé |\\n|-------------|---------|--------------|\\n[table rows]\\n\\n### Renseignements sur les menaces\\n- **Associations:** [associations]\\n- **Historique:** [historical]\\n- **Infrastructure:** [infrastructure]\\n\\n### MITRE ATT&CK\\n[mitre mappings]\\n\\n### Actions recommandées\\n**Immédiat:**\\n[immediate actions]\\n\\n**Court terme:**\\n[short-term actions]\\n\\n### Notes de l'analyste\\n[notes]",
    es: '## Informe de análisis IOC\\n\\n**Veredicto:** [verdict] | **Riesgo:** [risk] | **Confianza:** [confidence]\\n\\n### Resumen de evaluación\\n[summary]\\n\\n### Análisis de proveedores\\n| Proveedor | Veredicto | Hallazgo clave |\\n|-----------|-----------|----------------|\\n[table rows]\\n\\n### Inteligencia de amenazas\\n- **Asociaciones:** [associations]\\n- **Historial:** [historical]\\n- **Infraestructura:** [infrastructure]\\n\\n### MITRE ATT&CK\\n[mitre mappings]\\n\\n### Acciones recomendadas\\n**Inmediato:**\\n[immediate actions]\\n\\n**Corto plazo:**\\n[short-term actions]\\n\\n### Notas del analista\\n[notes]',
  };
  return templates[language] || templates['en'];
}
