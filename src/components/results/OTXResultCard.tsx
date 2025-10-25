import React, { useState } from 'react';
import { IOCAnalysisResult } from '@/types/ioc';
import { getIOCTypeLabel } from '@/utils/ioc-detector';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Activity,
  Target,
  Tag,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import './OTXResultCard.css';

interface OTXResultCardProps {
  result: IOCAnalysisResult;
}

interface Pulse {
  id: string;
  name: string;
  description: string;
  author: string;
  created: string;
  tags: string[];
  malware_families?: string[];
  targeted_countries?: string[];
}

export const OTXResultCard: React.FC<OTXResultCardProps> = ({ result }) => {
  const { t } = useTranslation('results');
  const [activeTab, setActiveTab] = useState<'pulses' | 'details'>('pulses');
  const [isThreatSummaryOpen, setIsThreatSummaryOpen] = useState(false);

  const { details } = result;

  const pulseCount = details?.pulseCount || 0;
  const maliciousCount = details?.malicious || 0;
  const suspiciousCount = details?.suspicious || 0;
  const pulses: Pulse[] = details?.pulses || [];

  // Analyze pulse severity based on tags and malware families
  const analyzePulseSeverity = () => {
    if (pulses.length === 0) return { severityLevel: 0, highSeverityCount: 0, mediumSeverityCount: 0 };

    let highSeverityCount = 0;
    let mediumSeverityCount = 0;

    const highSeverityIndicators = [
      'malware', 'ransomware', 'trojan', 'backdoor', 'botnet',
      'apt', 'exploit', 'c2', 'command and control', 'phishing',
      'cryptominer', 'rootkit', 'spyware', 'keylogger'
    ];

    const mediumSeverityIndicators = [
      'suspicious', 'scan', 'bruteforce', 'brute-force', 'vulnerability',
      'anomaly', 'anomalous', 'proxy', 'tor'
    ];

    pulses.forEach(pulse => {
      const allText = [
        pulse.name,
        pulse.description,
        ...(pulse.tags || []),
        ...(pulse.malware_families || [])
      ].join(' ').toLowerCase();

      const hasHighSeverity = highSeverityIndicators.some(indicator => allText.includes(indicator));
      const hasMediumSeverity = mediumSeverityIndicators.some(indicator => allText.includes(indicator));
      const hasMalwareFamilies = pulse.malware_families && pulse.malware_families.length > 0;

      if (hasHighSeverity || hasMalwareFamilies) {
        highSeverityCount++;
      } else if (hasMediumSeverity) {
        mediumSeverityCount++;
      } else {
        // Even without specific indicators, a pulse is still a threat indicator
        mediumSeverityCount++;
      }
    });

    return {
      severityLevel: highSeverityCount > 0 ? 3 : (mediumSeverityCount > 0 ? 2 : 1),
      highSeverityCount,
      mediumSeverityCount
    };
  };

  const { severityLevel, highSeverityCount, mediumSeverityCount } = analyzePulseSeverity();
  const threatScore = maliciousCount + suspiciousCount;

  // Get threat score color - pulses indicate threats
  const getScoreColor = () => {
    if (pulseCount === 0) return '#22c55e'; // green - no pulses = clean
    if (severityLevel >= 3 || maliciousCount > 0) return '#ef4444'; // red - high severity
    if (severityLevel >= 2 || suspiciousCount > 0 || pulseCount > 3) return '#eab308'; // yellow - medium severity
    return '#f97316'; // orange - any pulses are at least low severity threats
  };

  // Get status info - ANY pulse indicates a potential threat
  const getStatusInfo = () => {
    // No pulses = clean
    if (pulseCount === 0) {
      return {
        icon: <CheckCircle size={20} />,
        label: t('otx.status.clean'),
        className: 'clean',
        description: t('otx.statusDescription.clean')
      };
    }

    // High severity: malicious category OR high severity pulse content
    if (maliciousCount > 0 || severityLevel >= 3) {
      const reasons = [];
      if (maliciousCount > 0) reasons.push(`${maliciousCount} malicious pulse(s)`);
      if (highSeverityCount > 0) reasons.push(`${highSeverityCount} high-severity threat(s)`);

      return {
        icon: <XCircle size={20} />,
        label: t('otx.status.malicious'),
        className: 'malicious',
        description: t('otx.statusDescription.malicious', { reasons: reasons.join(', ') })
      };
    }

    // Medium severity: suspicious category OR medium severity content OR multiple pulses
    if (suspiciousCount > 0 || severityLevel >= 2 || pulseCount > 2) {
      const reasons = [];
      if (suspiciousCount > 0) reasons.push(`${suspiciousCount} suspicious pulse(s)`);
      if (mediumSeverityCount > 0) reasons.push(`${mediumSeverityCount} threat indicator(s)`);

      return {
        icon: <AlertTriangle size={20} />,
        label: t('otx.status.suspicious'),
        className: 'suspicious',
        description: t('otx.statusDescription.suspicious', { reasons: reasons.join(', ') })
      };
    }

    // Low severity: any pulses without clear categorization
    // Still a threat because pulses are IOCs by definition
    return {
      icon: <AlertCircle size={20} />,
      label: t('otx.status.flagged'),
      className: 'flagged',
      description: t('otx.statusDescription.flagged', { count: pulseCount })
    };
  };

  // Pagination for pulses
  const [pulsePage, setPulsePage] = useState(0);
  const pulsesPerPage = 5;
  const totalPages = Math.ceil(pulses.length / pulsesPerPage);
  const paginatedPulses = pulses.slice(
    pulsePage * pulsesPerPage,
    (pulsePage + 1) * pulsesPerPage
  );

  const statusInfo = getStatusInfo();

  return (
    <div className="otx-result-card">
      {/* Header */}
      <div className="otx-header">
        <div className="otx-header-left">
          <div
            className="otx-score-circle"
            style={{
              '--score-color': getScoreColor(),
              '--score-percent': `${pulseCount > 0 ? ((threatScore / pulseCount) * 100) : 0}%`
            } as React.CSSProperties}
          >
            <div className="otx-score-value">{pulseCount}</div>
            <div className="otx-score-label-small">Pulses</div>
          </div>
          <div className="otx-score-info">
            <div className="otx-score-title">{t('otx.threatIntelligence')}</div>
            <div className="otx-score-breakdown">
              <span className="otx-malicious">{maliciousCount} {t('otx.malicious')}</span>
              <span className="otx-suspicious">{suspiciousCount} {t('otx.suspicious')}</span>
            </div>
          </div>
        </div>

        <div className="otx-header-right">
          <div className="otx-ioc-info">
            <div className="otx-ioc-value">{result.ioc.value}</div>
            <div className="otx-ioc-type">{result.ioc.type.toUpperCase()}</div>
          </div>
        </div>

        <div className="otx-header-actions">
          <div className={`otx-status-badge ${statusInfo.className}`}>
            {statusInfo.icon}
            <span>{statusInfo.label}</span>
          </div>
        </div>
      </div>

      {/* Status Description */}
      <div className={`otx-status-description ${statusInfo.className}`}>
        <AlertCircle size={16} />
        {statusInfo.description}
      </div>

      {/* Threat Summary - Why this IOC is flagged */}
      {pulseCount > 0 && (
        <div
          className="otx-threat-summary"
          onClick={() => setIsThreatSummaryOpen(!isThreatSummaryOpen)}
        >
          <div className="otx-threat-summary-header">
            <Info size={16} />
            <strong>{t('otx.threatSummary.title')}</strong>
            {isThreatSummaryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          {isThreatSummaryOpen && (
            <div className="otx-threat-summary-content">
            <p dangerouslySetInnerHTML={{
              __html: t('otx.threatSummary.description', { count: pulseCount })
                .replace('<1>', '<strong>').replace('</1>', '</strong>')
            }} />
            {highSeverityCount > 0 && (
              <div className="otx-threat-summary-item severity-high">
                <AlertTriangle size={14} />
                <span dangerouslySetInnerHTML={{
                  __html: t('otx.threatSummary.highSeverity', { count: highSeverityCount })
                    .replace('<1>', '<strong>').replace('</1>', '</strong>')
                }} />
              </div>
            )}
            {mediumSeverityCount > 0 && (
              <div className="otx-threat-summary-item severity-medium">
                <AlertCircle size={14} />
                <span dangerouslySetInnerHTML={{
                  __html: t('otx.threatSummary.mediumSeverity', { count: mediumSeverityCount })
                    .replace('<1>', '<strong>').replace('</1>', '</strong>')
                }} />
              </div>
            )}
            <div className="otx-threat-summary-recommendation" dangerouslySetInnerHTML={{
              __html: t('otx.threatSummary.recommendation')
                .replace('<1>', '<strong>').replace('</1>', '</strong>')
            }} />
            </div>
          )}
        </div>
      )}

      {/* Unsupported IOC Type */}
      {result.unsupportedReason && result.supportedTypes && (
        <div className="otx-unsupported">
          <div className="otx-unsupported-message">
            <AlertTriangle size={16} />
            <span>{result.unsupportedReason}</span>
          </div>
          <div className="otx-supported-types">
            <span className="otx-supported-label">{t('otx.unsupportedType')}</span>
            <div className="otx-supported-badges">
              {result.supportedTypes.map((type, idx) => (
                <span key={idx} className="otx-ioc-badge">
                  {getIOCTypeLabel(type)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="otx-tabs">
        <button
          className={`otx-tab ${activeTab === 'pulses' ? 'active' : ''}`}
          onClick={() => setActiveTab('pulses')}
        >
          <Activity size={16} />
          {t('otx.tabs.pulses')}
          {pulses.length > 0 && (
            <span className="otx-tab-badge">{pulses.length}</span>
          )}
        </button>
        <button
          className={`otx-tab ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          <Info size={16} />
          {t('otx.tabs.details')}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'pulses' && (
        <div className="otx-tab-content">
          {pulses.length > 0 ? (
            <>
              <div className="otx-pulses-list">
                {paginatedPulses.map((pulse, index) => {
                  // Determine pulse severity for visual indicator
                  const getPulseSeverity = () => {
                    const allText = [
                      pulse.name,
                      pulse.description,
                      ...(pulse.tags || []),
                      ...(pulse.malware_families || [])
                    ].join(' ').toLowerCase();

                    const highSeverityIndicators = [
                      'malware', 'ransomware', 'trojan', 'backdoor', 'botnet',
                      'apt', 'exploit', 'c2', 'command and control', 'phishing',
                      'cryptominer', 'rootkit', 'spyware', 'keylogger'
                    ];

                    const mediumSeverityIndicators = [
                      'suspicious', 'scan', 'bruteforce', 'brute-force', 'vulnerability',
                      'anomaly', 'anomalous', 'proxy', 'tor'
                    ];

                    if (pulse.malware_families && pulse.malware_families.length > 0) {
                      return { level: 'high', label: t('otx.pulse.highSeverity'), className: 'severity-high' };
                    }

                    if (highSeverityIndicators.some(indicator => allText.includes(indicator))) {
                      return { level: 'high', label: t('otx.pulse.highSeverity'), className: 'severity-high' };
                    }

                    if (mediumSeverityIndicators.some(indicator => allText.includes(indicator))) {
                      return { level: 'medium', label: t('otx.pulse.mediumSeverity'), className: 'severity-medium' };
                    }

                    return { level: 'low', label: t('otx.pulse.threatIndicator'), className: 'severity-low' };
                  };

                  const severity = getPulseSeverity();

                  return (
                    <div key={index} className={`otx-pulse-item ${severity.className}`}>
                      <div className="otx-pulse-header">
                        <div className="otx-pulse-title-container">
                          <div className="otx-pulse-title">
                            <Target size={16} />
                            {pulse.name}
                          </div>
                          <span className={`otx-pulse-severity-badge ${severity.className}`}>
                            {severity.label}
                          </span>
                        </div>
                      </div>

                      {pulse.description && (
                        <div className="otx-pulse-description">
                          {pulse.description}
                        </div>
                      )}

                      {pulse.malware_families && pulse.malware_families.length > 0 && (
                        <div className="otx-pulse-malware">
                          <AlertTriangle size={14} />
                          <strong>{t('otx.pulse.malwareFamilies')}</strong>
                          <span>
                            {pulse.malware_families.map((family: any) => {
                              return typeof family === 'string' ? family : (family.display_name || family.id || family.name || String(family));
                            }).join(', ')}
                          </span>
                        </div>
                      )}

                      {pulse.tags && pulse.tags.length > 0 && (
                        <div className="otx-pulse-tags">
                          {pulse.tags.slice(0, 5).map((tag, idx) => (
                            <span key={idx} className="otx-pulse-tag">
                              <Tag size={12} />
                              {tag}
                            </span>
                          ))}
                          {pulse.tags.length > 5 && (
                            <span className="otx-pulse-tag-more">
                              {t('otx.pulse.moreCount', { count: pulse.tags.length - 5 })}
                            </span>
                          )}
                        </div>
                      )}

                      {pulse.targeted_countries && pulse.targeted_countries.length > 0 && (
                        <div className="otx-pulse-countries">
                          <Target size={14} />
                          <strong>{t('otx.pulse.targetedCountries')}</strong>
                          <span>
                            {pulse.targeted_countries.map((country: any) => {
                              return typeof country === 'string' ? country : (country.name || country.display_name || String(country));
                            }).join(', ')}
                          </span>
                        </div>
                      )}

                      <div className="otx-pulse-footer">
                        <span className="otx-pulse-date">
                          {new Date(pulse.created).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        <a
                          href={`https://otx.alienvault.com/pulse/${pulse.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="otx-pulse-link"
                        >
                          {t('otx.pulse.viewOnOTX')}
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="otx-pagination">
                  <button
                    className="otx-page-btn"
                    onClick={() => setPulsePage(Math.max(0, pulsePage - 1))}
                    disabled={pulsePage === 0}
                  >
                    {t('virustotal.pagination.previous')}
                  </button>
                  <span className="otx-page-info">
                    {t('virustotal.pagination.page', { current: pulsePage + 1, total: totalPages })}
                  </span>
                  <button
                    className="otx-page-btn"
                    onClick={() => setPulsePage(Math.min(totalPages - 1, pulsePage + 1))}
                    disabled={pulsePage === totalPages - 1}
                  >
                    {t('virustotal.pagination.next')}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="otx-no-pulses">
              <CheckCircle size={32} />
              <p>{t('otx.noPulses')}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'details' && (
        <div className="otx-tab-content">
          <div className="otx-details-grid">
            {/* Statistics */}
            <div className="otx-detail-section">
              <div className="otx-detail-header">
                <Activity size={16} />
                {t('otx.details.statistics')}
              </div>
              <div className="otx-detail-items">
                <div className="otx-detail-item">
                  <span className="otx-detail-label">{t('otx.details.totalPulses')}</span>
                  <span className="otx-detail-value">{pulseCount}</span>
                </div>
                <div className="otx-detail-item">
                  <span className="otx-detail-label">{t('otx.details.malicious')}</span>
                  <span className="otx-detail-value malicious">{maliciousCount}</span>
                </div>
                <div className="otx-detail-item">
                  <span className="otx-detail-label">{t('otx.details.suspicious')}</span>
                  <span className="otx-detail-value suspicious">{suspiciousCount}</span>
                </div>
                <div className="otx-detail-item">
                  <span className="otx-detail-label">{t('otx.details.harmless')}</span>
                  <span className="otx-detail-value">{details?.harmless || 0}</span>
                </div>
              </div>
            </div>

            {/* Reputation */}
            {details?.reputation !== undefined && (
              <div className="otx-detail-section">
                <div className="otx-detail-header">
                  <Info size={16} />
                  {t('otx.details.reputation')}
                </div>
                <div className="otx-detail-items">
                  <div className="otx-detail-item">
                    <span className="otx-detail-label">{t('otx.details.score')}</span>
                    <span className={`otx-detail-value ${details.reputation < 0 ? 'negative' : 'positive'}`}>
                      {details.reputation}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Related Adversaries */}
            {details?.related?.alienvault?.adversary && details.related.alienvault.adversary.length > 0 && (
              <div className="otx-detail-section full-width">
                <div className="otx-detail-header">
                  <Target size={16} />
                  {t('otx.details.relatedAdversaries')}
                </div>
                <div className="otx-tags">
                  {details.related.alienvault.adversary.map((adversary: any, index: number) => {
                    const adversaryName = typeof adversary === 'string' ? adversary : (adversary.display_name || adversary.id || adversary.name || adversary.value || String(adversary));
                    return <span key={index} className="otx-tag adversary">{adversaryName}</span>;
                  })}
                </div>
              </div>
            )}

            {/* Malware Families */}
            {details?.related?.alienvault?.malware_families && details.related.alienvault.malware_families.length > 0 && (
              <div className="otx-detail-section full-width">
                <div className="otx-detail-header">
                  <AlertTriangle size={16} />
                  {t('otx.details.malwareFamilies')}
                </div>
                <div className="otx-tags">
                  {details.related.alienvault.malware_families.map((family: any, index: number) => {
                    const familyName = typeof family === 'string' ? family : (family.display_name || family.id || family.name || family.value || String(family));
                    return <span key={index} className="otx-tag malware">{familyName}</span>;
                  })}
                </div>
              </div>
            )}

            {/* Targeted Industries */}
            {details?.related?.alienvault?.industries && details.related.alienvault.industries.length > 0 && (
              <div className="otx-detail-section full-width">
                <div className="otx-detail-header">
                  <Target size={16} />
                  {t('otx.details.targetedIndustries')}
                </div>
                <div className="otx-tags">
                  {details.related.alienvault.industries.map((industry: any, index: number) => {
                    const industryName = typeof industry === 'string' ? industry : (industry.display_name || industry.id || industry.name || industry.value || String(industry));
                    return <span key={index} className="otx-tag industry">{industryName}</span>;
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
