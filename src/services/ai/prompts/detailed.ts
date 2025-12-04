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
3. Evidence-based conclusions with clear reasoning
4. Include actionable recommendations for IR teams
5. Write all content in the specified language
6. No emojis, no special unicode characters
7. Target 800-1200 words total across all fields
8. Use suggestive tone for all recommendations (e.g., "It would be advisable to..." instead of commands)
9. The copy_markdown field should contain a full investigation report in markdown format

PRIORITY LEVELS:
- P0 (Critical): Confirmed active threat, system outage risk, immediate action required
- P1 (High): High-risk IOC, major threat indicators, urgent investigation needed
- P2 (Moderate): Suspicious activity, needs prioritized investigation
- P3 (Low): Minor indicators, routine investigation as part of normal workflow
- P4 (Negligible): Minimal risk, can be placed on backlog`;

export function buildDetailedPrompt(
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

IOCs for comprehensive analysis:
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
  "attack_vector": "attack vector or 'Not applicable'",
  
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
      "key_evidence": "specific data points"
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
      "procedure": "how technique is used"
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
    "limitations": "data gaps, analysis constraints",
    "additional_research": "what would improve analysis"
  },
  
  "references": ["relevant external resources if applicable"],
  
  "copy_markdown": "${markdownTemplate}"
}`;

  return {
    system: DETAILED_SYSTEM_PROMPT,
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
    en: '# IOC Investigation Report\\n\\n## Executive Summary\\n[executive_summary]\\n\\n## Verdict & Risk Assessment\\n| Verdict | Risk Level | Confidence | Priority | Escalation |\\n|---------|------------|------------|----------|------------|\\n| [verdict] | [risk] | [confidence] | [priority] | [escalation] |\\n\\n## IOC Analysis\\n[ioc details]\\n\\n## Provider Analysis\\n[provider table]\\n\\n## Threat Intelligence\\n[threat intel details]\\n\\n## MITRE ATT&CK Mapping\\n[mitre details]\\n\\n## False Positive Analysis\\n[fp analysis]\\n\\n## Response Actions\\n### Immediate\\n[immediate actions]\\n\\n### Short-term\\n[short-term actions]\\n\\n### Long-term\\n[long-term actions]\\n\\n## Detection Engineering\\n[detection rules]\\n\\n## Analyst Notes\\n[notes]\\n\\n## References\\n[references]',
    tr: '# IOC Soruşturma Raporu\\n\\n## Yönetici Özeti\\n[executive_summary]\\n\\n## Karar ve Risk Değerlendirmesi\\n| Karar | Risk Seviyesi | Güven | Öncelik | Eskalasyon |\\n|-------|---------------|-------|---------|------------|\\n| [verdict] | [risk] | [confidence] | [priority] | [escalation] |\\n\\n## IOC Analizi\\n[ioc details]\\n\\n## Sağlayıcı Analizi\\n[provider table]\\n\\n## Tehdit İstihbaratı\\n[threat intel details]\\n\\n## MITRE ATT&CK Eşlemesi\\n[mitre details]\\n\\n## Yanlış Pozitif Analizi\\n[fp analysis]\\n\\n## Müdahale Eylemleri\\n### Acil\\n[immediate actions]\\n\\n### Kısa Vadeli\\n[short-term actions]\\n\\n### Uzun Vadeli\\n[long-term actions]\\n\\n## Tespit Mühendisliği\\n[detection rules]\\n\\n## Analist Notları\\n[notes]\\n\\n## Referanslar\\n[references]',
    de: '# IOC-Untersuchungsbericht\\n\\n## Zusammenfassung\\n[executive_summary]\\n\\n## Urteil & Risikobewertung\\n| Urteil | Risikostufe | Vertrauen | Priorität | Eskalation |\\n|--------|-------------|-----------|-----------|------------|\\n| [verdict] | [risk] | [confidence] | [priority] | [escalation] |\\n\\n## IOC-Analyse\\n[ioc details]\\n\\n## Anbieteranalyse\\n[provider table]\\n\\n## Bedrohungsintelligenz\\n[threat intel details]\\n\\n## MITRE ATT&CK-Zuordnung\\n[mitre details]\\n\\n## Falsch-Positiv-Analyse\\n[fp analysis]\\n\\n## Reaktionsmaßnahmen\\n### Sofort\\n[immediate actions]\\n\\n### Kurzfristig\\n[short-term actions]\\n\\n### Langfristig\\n[long-term actions]\\n\\n## Erkennungstechnik\\n[detection rules]\\n\\n## Analysten-Notizen\\n[notes]\\n\\n## Referenzen\\n[references]',
    fr: "# Rapport d'investigation IOC\\n\\n## Résumé exécutif\\n[executive_summary]\\n\\n## Verdict et évaluation des risques\\n| Verdict | Niveau de risque | Confiance | Priorité | Escalade |\\n|---------|------------------|-----------|----------|----------|\\n| [verdict] | [risk] | [confidence] | [priority] | [escalation] |\\n\\n## Analyse IOC\\n[ioc details]\\n\\n## Analyse des fournisseurs\\n[provider table]\\n\\n## Renseignements sur les menaces\\n[threat intel details]\\n\\n## Cartographie MITRE ATT&CK\\n[mitre details]\\n\\n## Analyse des faux positifs\\n[fp analysis]\\n\\n## Actions de réponse\\n### Immédiat\\n[immediate actions]\\n\\n### Court terme\\n[short-term actions]\\n\\n### Long terme\\n[long-term actions]\\n\\n## Ingénierie de détection\\n[detection rules]\\n\\n## Notes de l'analyste\\n[notes]\\n\\n## Références\\n[references]",
    es: '# Informe de investigación IOC\\n\\n## Resumen ejecutivo\\n[executive_summary]\\n\\n## Veredicto y evaluación de riesgos\\n| Veredicto | Nivel de riesgo | Confianza | Prioridad | Escalación |\\n|-----------|-----------------|-----------|-----------|------------|\\n| [verdict] | [risk] | [confidence] | [priority] | [escalation] |\\n\\n## Análisis IOC\\n[ioc details]\\n\\n## Análisis de proveedores\\n[provider table]\\n\\n## Inteligencia de amenazas\\n[threat intel details]\\n\\n## Mapeo MITRE ATT&CK\\n[mitre details]\\n\\n## Análisis de falsos positivos\\n[fp analysis]\\n\\n## Acciones de respuesta\\n### Inmediato\\n[immediate actions]\\n\\n### Corto plazo\\n[short-term actions]\\n\\n### Largo plazo\\n[long-term actions]\\n\\n## Ingeniería de detección\\n[detection rules]\\n\\n## Notas del analista\\n[notes]\\n\\n## Referencias\\n[references]',
  };
  return templates[language] || templates['en'];
}
