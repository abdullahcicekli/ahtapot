import React, { useState, useMemo, useRef } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  RefreshCw,
  Target,
  Zap,
  FileText,
  Users,
  Activity,
  Server,
  Globe,
  Search,
  BookOpen,
  XCircle,
  Image,
  ExternalLink,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { AIAnalysisResult, AIAnalysisMode, AI_PROVIDER_CONFIGS } from '@/types/ai';
import { AISummaryResponse, AIAnalysisResponse, AIDetailedResponse } from '@/types/aiResponse';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import './AIStructuredResultCard.css';

interface AIStructuredResultCardProps {
  result: AIAnalysisResult;
  onRequery?: () => void;
  isCached?: boolean;
  defaultExpanded?: boolean;
}

// Truncate long URLs/links for display
const truncateLink = (text: string, maxLength: number = 50): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Make text with URLs clickable
const renderTextWithLinks = (text: string): React.ReactNode => {
  if (!text) return null;
  
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="ai-link"
          title={part}
        >
          {truncateLink(part)}
          <ExternalLink size={10} />
        </a>
      );
    }
    return part;
  });
};

export const AIStructuredResultCard: React.FC<AIStructuredResultCardProps> = ({
  result,
  onRequery,
  isCached = false,
  defaultExpanded = true,
}) => {
  const { t } = useTranslation('sidepanel');
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const providerConfig = AI_PROVIDER_CONFIGS[result.provider];
  const formattedTime = new Date(result.timestamp).toLocaleTimeString();

  // Parse JSON from content
  const parsedResponse = useMemo(() => {
    try {
      let content = result.content;
      
      // Remove markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        content = jsonMatch[1];
      }
      
      content = content.trim();
      const parsed = JSON.parse(content);
      return { success: true, data: parsed, error: null };
    } catch (e) {
      return { success: false, data: null, error: result.content };
    }
  }, [result.content]);

  const getModeLabel = (mode: AIAnalysisMode) => {
    return t(`ai.modes.${mode}`);
  };

  // Localized verdict label
  const getVerdictLabel = (verdict: string) => {
    return t(`ai.verdicts.${verdict}`) || verdict;
  };

  // Localized risk level label
  const getRiskLabel = (risk: string) => {
    return t(`ai.riskLevels.${risk}`) || risk;
  };

  // Localized confidence label
  const getConfidenceLabel = (confidence: string) => {
    return t(`ai.confidenceLevels.${confidence}`) || confidence;
  };

  const getVerdictConfig = (verdict: string) => {
    const configs: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
      malicious: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', icon: <XCircle size={16} /> },
      suspicious: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: <AlertTriangle size={16} /> },
      likely_benign: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', icon: <Shield size={16} /> },
      clean: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', icon: <CheckCircle size={16} /> },
      unknown: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.15)', icon: <AlertCircle size={16} /> },
    };
    return configs[verdict] || configs.unknown;
  };

  const getRiskConfig = (risk: string) => {
    const configs: Record<string, { color: string; bg: string }> = {
      critical: { color: '#dc2626', bg: 'rgba(220, 38, 38, 0.15)' },
      high: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
      medium: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
      low: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
      info: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.15)' },
    };
    return configs[risk] || configs.info;
  };

  // Confidence colors - HIGH is good (green), LOW is uncertain (orange)
  const getConfidenceConfig = (confidence: string) => {
    const configs: Record<string, { color: string; bg: string }> = {
      high: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
      medium: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
      low: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
    };
    return configs[confidence] || configs.medium;
  };

  // Copy markdown from response or generate fallback
  const handleCopyMarkdown = async () => {
    try {
      let markdown = '';
      
      if (parsedResponse.success && parsedResponse.data?.copy_markdown) {
        markdown = parsedResponse.data.copy_markdown;
      } else {
        // Fallback: generate markdown from content
        markdown = result.content;
      }
      
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Export as image
  const handleExportImage = async () => {
    if (!contentRef.current) return;
    
    setExporting(true);
    try {
      // Temporarily expand for full capture
      const wasExpanded = isExpanded;
      if (!wasExpanded) setIsExpanded(true);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: '#1E1E24',
        scale: 2,
        logging: false,
        useCORS: true,
      });
      
      const link = document.createElement('a');
      link.download = `ai-analysis-${result.provider}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      if (!wasExpanded) setIsExpanded(false);
    } catch (err) {
      console.error('Failed to export image:', err);
    } finally {
      setExporting(false);
    }
  };

  // Render error state
  if (result.error) {
    return (
      <div className="ai-structured-card ai-structured-error" ref={cardRef}>
        <div className="ai-structured-header" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="ai-structured-header-left">
            <AlertCircle size={18} className="ai-structured-error-icon" />
            <span className="ai-structured-provider">{providerConfig.displayName}</span>
            <span className="ai-structured-mode-badge error">{getModeLabel(result.mode)}</span>
          </div>
          <div className="ai-structured-header-right">
            <span className="ai-structured-time">
              <Clock size={12} />
              {formattedTime}
            </span>
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
        {isExpanded && (
          <div className="ai-structured-content ai-structured-content-error">
            <p>{result.error}</p>
          </div>
        )}
      </div>
    );
  }

  // Render fallback for unparseable content
  if (!parsedResponse.success) {
    return (
      <div className="ai-structured-card" ref={cardRef}>
        <div className="ai-structured-header" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="ai-structured-header-left">
            <img src={providerConfig.logo} alt={providerConfig.displayName} className="ai-structured-logo" />
            <span className="ai-structured-provider">{providerConfig.displayName}</span>
            <span className="ai-structured-mode-badge">{getModeLabel(result.mode)}</span>
            {isCached && <span className="ai-structured-cached-badge">{t('ai.cached')}</span>}
          </div>
          <div className="ai-structured-header-right">
            <span className="ai-structured-time">
              <Clock size={12} />
              {formattedTime}
            </span>
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
        {isExpanded && (
          <div className="ai-structured-content" ref={contentRef}>
            <pre className="ai-structured-raw">{parsedResponse.error}</pre>
            <div className="ai-structured-actions" data-html2canvas-ignore="true">
              <button className="ai-structured-btn" onClick={handleCopyMarkdown}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? t('ai.copied') || 'Copied' : t('ai.copyMarkdown')}
              </button>
              {onRequery && (
                <button className="ai-structured-btn requery" onClick={onRequery}>
                  <RefreshCw size={14} />
                  {t('ai.reanalyze')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  const data = parsedResponse.data;
  const verdictConfig = getVerdictConfig(data.verdict);
  const riskConfig = getRiskConfig(data.risk_level);

  // Render Summary Mode
  if (result.mode === AIAnalysisMode.SUMMARY) {
    const summaryData = data as AISummaryResponse;
    return (
      <div className="ai-structured-card" ref={cardRef}>
        <div className="ai-structured-header" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="ai-structured-header-left">
            <img src={providerConfig.logo} alt={providerConfig.displayName} className="ai-structured-logo" />
            <span className="ai-structured-provider">{providerConfig.displayName}</span>
            <span className="ai-structured-mode-badge">{getModeLabel(result.mode)}</span>
            {isCached && <span className="ai-structured-cached-badge">{t('ai.cached')}</span>}
          </div>
          <div className="ai-structured-header-right">
            <span className="ai-structured-time">
              <Clock size={12} />
              {formattedTime}
            </span>
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>

        {isExpanded && (
          <div className="ai-structured-content" ref={contentRef}>
            {/* Verdict Banner */}
            <div 
              className="ai-verdict-banner"
              style={{ background: verdictConfig.bg, borderColor: verdictConfig.color }}
            >
              <div className="ai-verdict-main">
                <div className="ai-verdict-icon" style={{ color: verdictConfig.color }}>
                  {verdictConfig.icon}
                </div>
                <span className="ai-verdict-label" style={{ color: verdictConfig.color }}>
                  {getVerdictLabel(summaryData.verdict)}
                </span>
              </div>
              <div className="ai-verdict-meta">
                {summaryData.priority && (
                  <span className="ai-priority-badge" data-priority={summaryData.priority}>{summaryData.priority}</span>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="ai-section">
              <div className="ai-section-header">
                <FileText size={16} />
                <span>{t('ai.sections.summary')}</span>
              </div>
              <p className="ai-section-text">{renderTextWithLinks(summaryData.summary)}</p>
            </div>

            {/* Key Signals */}
            <div className="ai-section">
              <div className="ai-section-header">
                <Activity size={16} />
                <span>{t('ai.sections.keySignals')}</span>
              </div>
              <div className="ai-signals-grid">
                <div className="ai-signal-item">
                  <span className="ai-signal-label">{t('ai.labels.detection')}</span>
                  <span className="ai-signal-value">{renderTextWithLinks(summaryData.key_signals?.detection)}</span>
                </div>
                <div className="ai-signal-item">
                  <span className="ai-signal-label">{t('ai.labels.reputation')}</span>
                  <span className="ai-signal-value">{renderTextWithLinks(summaryData.key_signals?.reputation)}</span>
                </div>
                <div className="ai-signal-item">
                  <span className="ai-signal-label">{t('ai.labels.associations')}</span>
                  <span className="ai-signal-value">{renderTextWithLinks(summaryData.key_signals?.associations)}</span>
                </div>
              </div>
            </div>

            {/* Recommended Action */}
            <div className="ai-action-box">
              <Zap size={16} />
              <span>{renderTextWithLinks(summaryData.recommended_action)}</span>
            </div>

            {/* Actions */}
            <div className="ai-structured-actions" data-html2canvas-ignore="true">
              <button className="ai-structured-btn" onClick={handleCopyMarkdown}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : t('ai.copyMarkdown')}
              </button>
              <button className="ai-structured-btn" onClick={handleExportImage} disabled={exporting}>
                <Image size={14} />
                {exporting ? '...' : t('ai.exportImage')}
              </button>
              {onRequery && (
                <button className="ai-structured-btn requery" onClick={onRequery}>
                  <RefreshCw size={14} />
                  {t('ai.reanalyze')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render Analysis Mode
  if (result.mode === AIAnalysisMode.ANALYSIS) {
    const analysisData = data as AIAnalysisResponse;
    return (
      <div className="ai-structured-card" ref={cardRef}>
        <div className="ai-structured-header" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="ai-structured-header-left">
            <img src={providerConfig.logo} alt={providerConfig.displayName} className="ai-structured-logo" />
            <span className="ai-structured-provider">{providerConfig.displayName}</span>
            <span className="ai-structured-mode-badge">{getModeLabel(result.mode)}</span>
            {isCached && <span className="ai-structured-cached-badge">{t('ai.cached')}</span>}
          </div>
          <div className="ai-structured-header-right">
            <span className="ai-structured-time">
              <Clock size={12} />
              {formattedTime}
            </span>
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>

        {isExpanded && (
          <div className="ai-structured-content" ref={contentRef}>
            {/* Verdict Banner */}
            <div 
              className="ai-verdict-banner"
              style={{ background: verdictConfig.bg, borderColor: verdictConfig.color }}
            >
              <div className="ai-verdict-main">
                <div className="ai-verdict-icon" style={{ color: verdictConfig.color }}>
                  {verdictConfig.icon}
                </div>
                <span className="ai-verdict-label" style={{ color: verdictConfig.color }}>
                  {getVerdictLabel(analysisData.verdict)}
                </span>
              </div>
              <div className="ai-verdict-meta">
                {analysisData.priority && (
                  <span className="ai-priority-badge" data-priority={analysisData.priority}>{analysisData.priority}</span>
                )}
                {analysisData.escalation_required && (
                  <span className="ai-escalation-badge">{t('ai.labels.escalation')}</span>
                )}
              </div>
            </div>

            {/* Assessment Summary */}
            <div className="ai-section">
              <div className="ai-section-header">
                <FileText size={16} />
                <span>{t('ai.sections.assessment')}</span>
              </div>
              <p className="ai-section-text">{renderTextWithLinks(analysisData.assessment_summary)}</p>
            </div>

            {/* Provider Analysis */}
            {analysisData.provider_analysis && analysisData.provider_analysis.length > 0 && (
              <div className="ai-section">
                <div className="ai-section-header">
                  <Server size={16} />
                  <span>{t('ai.sections.providerAnalysis')}</span>
                </div>
                <div className="ai-provider-table">
                  {analysisData.provider_analysis.map((p, i) => (
                    <div key={i} className="ai-provider-row">
                      <span className="ai-provider-name">{p.provider}</span>
                      <span className="ai-provider-verdict">{p.verdict}</span>
                      <span className="ai-provider-finding">{renderTextWithLinks(p.key_finding)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Consensus */}
            {analysisData.consensus && (
              <div className="ai-section">
                <div className="ai-section-header">
                  <Users size={16} />
                  <span>{t('ai.sections.consensus')}</span>
                </div>
                <div className="ai-consensus-grid">
                  <div className="ai-consensus-item">
                    <span className="ai-consensus-label">{t('ai.labels.agreement')}</span>
                    <span className="ai-consensus-value">{renderTextWithLinks(analysisData.consensus.agreement)}</span>
                  </div>
                  <div className="ai-consensus-item">
                    <span className="ai-consensus-label">{t('ai.labels.conflicts')}</span>
                    <span className="ai-consensus-value">{renderTextWithLinks(analysisData.consensus.conflicts)}</span>
                  </div>
                  <div className="ai-consensus-item">
                    <span className="ai-consensus-label">{t('ai.labels.dataGaps')}</span>
                    <span className="ai-consensus-value">{renderTextWithLinks(analysisData.consensus.data_gaps)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Threat Intel */}
            {analysisData.threat_intel && (
              <div className="ai-section">
                <div className="ai-section-header">
                  <Target size={16} />
                  <span>{t('ai.sections.threatIntel')}</span>
                </div>
                <div className="ai-intel-grid">
                  <div className="ai-intel-item">
                    <span className="ai-intel-label">{t('ai.labels.knownAssociations')}</span>
                    <span className="ai-intel-value">{renderTextWithLinks(analysisData.threat_intel.known_associations)}</span>
                  </div>
                  <div className="ai-intel-item">
                    <span className="ai-intel-label">{t('ai.labels.historicalActivity')}</span>
                    <span className="ai-intel-value">{renderTextWithLinks(analysisData.threat_intel.historical_activity)}</span>
                  </div>
                  <div className="ai-intel-item">
                    <span className="ai-intel-label">{t('ai.labels.infrastructureInfo')}</span>
                    <span className="ai-intel-value">{renderTextWithLinks(analysisData.threat_intel.infrastructure)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* MITRE ATT&CK */}
            {analysisData.mitre_attack && analysisData.mitre_attack.length > 0 && (
              <div className="ai-section">
                <div className="ai-section-header">
                  <Shield size={16} />
                  <span>{t('ai.sections.mitreAttack')}</span>
                </div>
                <div className="ai-mitre-list">
                  {analysisData.mitre_attack.map((m, i) => (
                    <div key={i} className="ai-mitre-item">
                      <span className="ai-mitre-tactic">{m.tactic}</span>
                      <span className="ai-mitre-technique">{m.technique}</span>
                      <span className="ai-mitre-relevance">{renderTextWithLinks(m.relevance)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Actions */}
            {analysisData.recommended_actions && (
              <div className="ai-section">
                <div className="ai-section-header">
                  <Zap size={16} />
                  <span>{t('ai.sections.recommendedActions')}</span>
                </div>
                <div className="ai-actions-list">
                  {analysisData.recommended_actions.immediate?.length > 0 && (
                    <div className="ai-action-group">
                      <span className="ai-action-label urgent">{t('ai.labels.immediate')}</span>
                      <ul>
                        {analysisData.recommended_actions.immediate.map((a, i) => (
                          <li key={i}>{renderTextWithLinks(a)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysisData.recommended_actions.short_term?.length > 0 && (
                    <div className="ai-action-group">
                      <span className="ai-action-label">{t('ai.labels.shortTerm')}</span>
                      <ul>
                        {analysisData.recommended_actions.short_term.map((a, i) => (
                          <li key={i}>{renderTextWithLinks(a)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysisData.recommended_actions.investigation_steps?.length > 0 && (
                    <div className="ai-action-group">
                      <span className="ai-action-label">{t('ai.labels.investigation')}</span>
                      <ol>
                        {analysisData.recommended_actions.investigation_steps.map((a, i) => (
                          <li key={i}>{renderTextWithLinks(a)}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Analyst Notes */}
            {analysisData.analyst_notes && (
              <div className="ai-section notes">
                <div className="ai-section-header">
                  <BookOpen size={16} />
                  <span>{t('ai.sections.analystNotes')}</span>
                </div>
                <div className="ai-notes-content">
                  <p><strong>{t('ai.labels.limitations')}:</strong> {renderTextWithLinks(analysisData.analyst_notes.limitations)}</p>
                  <p><strong>{t('ai.labels.followUp')}:</strong> {renderTextWithLinks(analysisData.analyst_notes.follow_up)}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="ai-structured-actions" data-html2canvas-ignore="true">
              <button className="ai-structured-btn" onClick={handleCopyMarkdown}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : t('ai.copyMarkdown')}
              </button>
              <button className="ai-structured-btn" onClick={handleExportImage} disabled={exporting}>
                <Image size={14} />
                {exporting ? '...' : t('ai.exportImage')}
              </button>
              {onRequery && (
                <button className="ai-structured-btn requery" onClick={onRequery}>
                  <RefreshCw size={14} />
                  {t('ai.reanalyze')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render Detailed Mode
  const detailedData = data as AIDetailedResponse;
  return (
    <div className="ai-structured-card" ref={cardRef}>
      <div className="ai-structured-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="ai-structured-header-left">
          <img src={providerConfig.logo} alt={providerConfig.displayName} className="ai-structured-logo" />
          <span className="ai-structured-provider">{providerConfig.displayName}</span>
          <span className="ai-structured-mode-badge detailed">{getModeLabel(result.mode)}</span>
          {isCached && <span className="ai-structured-cached-badge">{t('ai.cached')}</span>}
        </div>
        <div className="ai-structured-header-right">
          <span className="ai-structured-time">
            <Clock size={12} />
            {formattedTime}
          </span>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {isExpanded && (
        <div className="ai-structured-content detailed" ref={contentRef}>
          {/* Verdict Banner */}
          <div 
            className="ai-verdict-banner detailed"
            style={{ background: verdictConfig.bg, borderColor: verdictConfig.color }}
          >
            <div className="ai-verdict-main">
              <div className="ai-verdict-icon" style={{ color: verdictConfig.color }}>
                {verdictConfig.icon}
              </div>
              <span className="ai-verdict-label" style={{ color: verdictConfig.color }}>
                {getVerdictLabel(detailedData.verdict)}
              </span>
            </div>
            <div className="ai-verdict-meta">
              {detailedData.priority && (
                <span className="ai-priority-badge" data-priority={detailedData.priority}>{detailedData.priority}</span>
              )}
              {detailedData.escalation_required && (
                <span className="ai-escalation-badge">{t('ai.labels.escalation')}</span>
              )}
            </div>
          </div>

          {/* Executive Summary */}
          <div className="ai-section executive">
            <div className="ai-section-header">
              <FileText size={16} />
              <span>{t('ai.sections.executiveSummary')}</span>
            </div>
            <p className="ai-section-text">{renderTextWithLinks(detailedData.executive_summary)}</p>
          </div>

          {/* IOC Analysis */}
          {detailedData.ioc_analysis && detailedData.ioc_analysis.length > 0 && (
            <div className="ai-section">
              <div className="ai-section-header">
                <Search size={16} />
                <span>{t('ai.sections.iocAnalysis')}</span>
              </div>
              {detailedData.ioc_analysis.map((ioc, i) => (
                <div key={i} className="ai-ioc-card">
                  <div className="ai-ioc-header">
                    <code className="ai-ioc-value">{ioc.indicator}</code>
                    <span className="ai-ioc-type">{ioc.type}</span>
                    <span className="ai-ioc-class">{ioc.classification}</span>
                  </div>
                  <p className="ai-ioc-context">{renderTextWithLinks(ioc.context)}</p>
                  <div className="ai-ioc-dates">
                    <span>First seen: {ioc.first_seen}</span>
                    <span>Last seen: {ioc.last_seen}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Provider Analysis */}
          {detailedData.provider_analysis && detailedData.provider_analysis.length > 0 && (
            <div className="ai-section">
              <div className="ai-section-header">
                <Server size={16} />
                <span>{t('ai.sections.providerAnalysis')}</span>
              </div>
              <div className="ai-provider-cards">
                {detailedData.provider_analysis.map((p, i) => (
                  <div key={i} className="ai-provider-card">
                    <div className="ai-provider-card-header">
                      <span className="ai-provider-name">{p.provider}</span>
                    </div>
                    <p className="ai-provider-result">{renderTextWithLinks(p.result)}</p>
                    <p className="ai-provider-evidence">{renderTextWithLinks(p.key_evidence)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cross Reference */}
          {detailedData.cross_reference && (
            <div className="ai-section">
              <div className="ai-section-header">
                <Users size={16} />
                <span>{t('ai.sections.crossReference')}</span>
              </div>
              <div className="ai-cross-ref-grid">
                <div className="ai-cross-ref-item">
                  <span className="ai-cross-ref-label">{t('ai.labels.agreement')}</span>
                  <p>{renderTextWithLinks(detailedData.cross_reference.consensus)}</p>
                </div>
                <div className="ai-cross-ref-item">
                  <span className="ai-cross-ref-label">{t('ai.labels.conflicts')}</span>
                  <p>{renderTextWithLinks(detailedData.cross_reference.conflicting_data)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Threat Intel */}
          {detailedData.threat_intel && (
            <div className="ai-section">
              <div className="ai-section-header">
                <Target size={16} />
                <span>{t('ai.sections.threatIntel')}</span>
              </div>
              <div className="ai-threat-intel-grid">
                <div className="ai-threat-intel-item">
                  <span className="ai-threat-intel-label">Malware Family</span>
                  <span className="ai-threat-intel-value">{renderTextWithLinks(detailedData.threat_intel.malware_family)}</span>
                </div>
                <div className="ai-threat-intel-item">
                  <span className="ai-threat-intel-label">Threat Actor</span>
                  <span className="ai-threat-intel-value">{renderTextWithLinks(detailedData.threat_intel.threat_actor)}</span>
                </div>
                <div className="ai-threat-intel-item">
                  <span className="ai-threat-intel-label">Campaign</span>
                  <span className="ai-threat-intel-value">{renderTextWithLinks(detailedData.threat_intel.campaign)}</span>
                </div>
                <div className="ai-threat-intel-item">
                  <span className="ai-threat-intel-label">Target Sectors</span>
                  <span className="ai-threat-intel-value">{renderTextWithLinks(detailedData.threat_intel.target_sectors)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Infrastructure */}
          {detailedData.infrastructure && (
            <div className="ai-section">
              <div className="ai-section-header">
                <Globe size={16} />
                <span>{t('ai.sections.infrastructure')}</span>
              </div>
              <div className="ai-infra-grid">
                <div className="ai-infra-item">
                  <span className="ai-infra-label">Hosting</span>
                  <span className="ai-infra-value">{renderTextWithLinks(detailedData.infrastructure.hosting)}</span>
                </div>
                <div className="ai-infra-item">
                  <span className="ai-infra-label">ASN</span>
                  <span className="ai-infra-value">{renderTextWithLinks(detailedData.infrastructure.asn_info)}</span>
                </div>
                <div className="ai-infra-item">
                  <span className="ai-infra-label">Geolocation</span>
                  <span className="ai-infra-value">{renderTextWithLinks(detailedData.infrastructure.geolocation)}</span>
                </div>
                <div className="ai-infra-item">
                  <span className="ai-infra-label">Registrar</span>
                  <span className="ai-infra-value">{renderTextWithLinks(detailedData.infrastructure.registrar)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Response Actions */}
          {detailedData.response_actions && (
            <div className="ai-section">
              <div className="ai-section-header">
                <Zap size={16} />
                <span>{t('ai.sections.responseActions')}</span>
              </div>
              <div className="ai-response-actions">
                {detailedData.response_actions.immediate?.length > 0 && (
                  <div className="ai-action-group">
                    <span className="ai-action-label urgent">{t('ai.labels.immediate')} (0-1h)</span>
                    <ul>
                      {detailedData.response_actions.immediate.map((a, i) => (
                        <li key={i}>{renderTextWithLinks(a)}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {detailedData.response_actions.short_term?.length > 0 && (
                  <div className="ai-action-group">
                    <span className="ai-action-label">{t('ai.labels.shortTerm')} (1-24h)</span>
                    <ul>
                      {detailedData.response_actions.short_term.map((a, i) => (
                        <li key={i}>{renderTextWithLinks(a)}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {detailedData.response_actions.long_term?.length > 0 && (
                  <div className="ai-action-group">
                    <span className="ai-action-label">{t('ai.labels.longTerm')} (1-7d)</span>
                    <ul>
                      {detailedData.response_actions.long_term.map((a, i) => (
                        <li key={i}>{renderTextWithLinks(a)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* References */}
          {detailedData.references && detailedData.references.length > 0 && (
            <div className="ai-section">
              <div className="ai-section-header">
                <BookOpen size={16} />
                <span>{t('ai.sections.references')}</span>
              </div>
              <ul className="ai-references-list">
                {detailedData.references.map((ref, i) => (
                  <li key={i}>{renderTextWithLinks(ref)}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="ai-structured-actions" data-html2canvas-ignore="true">
            <button className="ai-structured-btn" onClick={handleCopyMarkdown}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : t('ai.copyMarkdown')}
            </button>
            <button className="ai-structured-btn" onClick={handleExportImage} disabled={exporting}>
              <Image size={14} />
              {exporting ? '...' : t('ai.exportImage')}
            </button>
            {onRequery && (
              <button className="ai-structured-btn requery" onClick={onRequery}>
                <RefreshCw size={14} />
                {t('ai.reanalyze')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
