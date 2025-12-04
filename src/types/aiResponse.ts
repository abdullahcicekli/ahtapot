/**
 * Structured AI Response Types
 * Fixed JSON schemas for each analysis mode
 */

// Common types
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type Verdict = 'malicious' | 'suspicious' | 'likely_benign' | 'clean' | 'unknown';
export type Confidence = 'high' | 'medium' | 'low';

// Summary Mode Response (~200 words)
export interface AISummaryResponse {
  verdict: Verdict;
  risk_level: RiskLevel;
  confidence: Confidence;
  summary: string;
  key_signals: {
    detection: string;
    reputation: string;
    associations: string;
  };
  recommended_action: string;
  copy_markdown?: string;
}

// Analysis Mode Response (400-600 words)
export interface AIAnalysisResponse {
  verdict: Verdict;
  risk_level: RiskLevel;
  confidence: Confidence;
  escalation_required: boolean;
  
  assessment_summary: string;
  
  provider_analysis: {
    provider: string;
    verdict: string;
    key_finding: string;
  }[];
  
  consensus: {
    agreement: string;
    conflicts: string;
    data_gaps: string;
  };
  
  threat_intel: {
    known_associations: string;
    historical_activity: string;
    infrastructure: string;
  };
  
  false_positive_indicators: string[];
  
  mitre_attack?: {
    tactic: string;
    technique: string;
    relevance: string;
  }[];
  
  recommended_actions: {
    immediate: string[];
    short_term: string[];
    investigation_steps: string[];
  };
  
  analyst_notes: {
    confidence_factors: string;
    limitations: string;
    follow_up: string;
  };
  copy_markdown?: string;
}

// Detailed Mode Response (800-1200 words)
export interface AIDetailedResponse {
  verdict: Verdict;
  risk_level: RiskLevel;
  confidence: Confidence;
  escalation_required: boolean;
  attack_vector: string;
  priority: string;
  
  executive_summary: string;
  
  ioc_analysis: {
    indicator: string;
    type: string;
    classification: string;
    first_seen: string;
    last_seen: string;
    context: string;
  }[];
  
  provider_analysis: {
    provider: string;
    result: string;
    confidence_level: Confidence;
    key_evidence: string;
    source_credibility: string;
  }[];
  
  cross_reference: {
    consensus: string;
    conflicting_data: string;
    unique_findings: string;
    data_quality: string;
  };
  
  threat_intel: {
    malware_family: string;
    threat_actor: string;
    campaign: string;
    target_sectors: string;
  };
  
  infrastructure: {
    hosting: string;
    asn_info: string;
    geolocation: string;
    registrar: string;
  };
  
  historical: {
    timeline: string;
    activity_pattern: string;
  };
  
  mitre_attack: {
    tactic: string;
    technique: string;
    procedure: string;
    evidence_level: string;
  }[];
  
  attack_chain_analysis: string;
  
  false_positive: {
    probability: string;
    increasing_factors: string[];
    decreasing_factors: string[];
    similar_legitimate: string;
    recommendation: string;
  };
  
  response_actions: {
    immediate: string[];
    short_term: string[];
    long_term: string[];
    investigation_checklist: string[];
  };
  
  detection_engineering: {
    suggested_rules: string[];
  };
  
  analyst_notes: {
    confidence_factors: string;
    limitations: string;
    additional_research: string;
  };
  
  references: string[];
  copy_markdown?: string;
}

// Union type for all responses
export type AIStructuredResponse = AISummaryResponse | AIAnalysisResponse | AIDetailedResponse;

// Cache key format: provider-ioc-mode-language
export interface AICacheKey {
  provider: string;
  ioc: string;
  mode: string;
  language: string;
}

export interface AICachedResult {
  key: AICacheKey;
  response: AIStructuredResponse;
  rawContent: string;
  timestamp: number;
  expiresAt: number;
}

