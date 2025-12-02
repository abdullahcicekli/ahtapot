import React from 'react';
import { IOCAnalysisResult } from '@/types/ioc';
import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink, 
  Shield, 
  Globe,
  Server,
  Eye,
  XCircle,
  Info
} from 'lucide-react';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import './ScamalyticsResultCard.css';

interface ScamalyticsResultCardProps {
  result: IOCAnalysisResult;
}

export const ScamalyticsResultCard: React.FC<ScamalyticsResultCardProps> = ({ result }) => {
  const { t } = useTranslation('results');
  const { details, status, ioc } = result;

  const score = details?.score ?? 0;
  const risk = details?.risk || 'unknown';
  const ispScore = details?.isp_score;
  const ispRisk = details?.isp_risk;
  const proxyInfo = details?.proxy_info || {};
  const fraudIndicators = details?.fraud_indicators || [];
  const isBlacklisted = details?.is_blacklisted || false;
  const scamalyticsUrl = details?.scamalytics_url || `https://scamalytics.com/ip/${ioc.value}`;

  const getRiskColor = (risk: string) => {
    const riskLower = risk?.toLowerCase() || '';
    if (riskLower === 'very high') return '#dc2626';
    if (riskLower === 'high') return '#ef4444';
    if (riskLower === 'medium') return '#f59e0b';
    if (riskLower === 'low') return '#3b82f6';
    if (riskLower === 'very low') return '#22c55e';
    return '#6b7280';
  };

  const getStatusIcon = () => {
    if (status === 'malicious') return <XCircle size={20} />;
    if (status === 'suspicious') return <AlertTriangle size={20} />;
    return <CheckCircle size={20} />;
  };

  const getStatusBadge = () => {
    const riskLower = risk?.toLowerCase() || '';
    if (riskLower === 'very high') return { label: t('scamalytics.status.veryHigh'), className: 'very-high' };
    if (riskLower === 'high') return { label: t('scamalytics.status.high'), className: 'high' };
    if (riskLower === 'medium') return { label: t('scamalytics.status.medium'), className: 'medium' };
    if (riskLower === 'low') return { label: t('scamalytics.status.low'), className: 'low' };
    if (riskLower === 'very low') return { label: t('scamalytics.status.veryLow'), className: 'very-low' };
    return { label: t('scamalytics.status.unknown'), className: 'unknown' };
  };

  const statusBadge = getStatusBadge();
  const riskColor = getRiskColor(risk);

  return (
    <div className="scamalytics-result-card">
      {/* Header */}
      <div className="scamalytics-header">
        <div className="scamalytics-header-left">
          <div 
            className="scamalytics-score-circle"
            style={{ '--score-color': riskColor } as React.CSSProperties}
          >
            <div className="scamalytics-score-value" style={{ color: riskColor }}>{score}</div>
            <div className="scamalytics-score-label-small">/100</div>
          </div>
          <div className="scamalytics-score-info">
            <div className="scamalytics-score-title">{t('scamalytics.title')}</div>
            <div className="scamalytics-risk-value" style={{ color: riskColor }}>
              {risk.charAt(0).toUpperCase() + risk.slice(1)} Risk
            </div>
          </div>
        </div>

        <div className="scamalytics-header-right">
          <div className="scamalytics-ioc-info">
            <div className="scamalytics-ioc-value">{ioc.value}</div>
            <div className="scamalytics-ioc-type">{ioc.type.toUpperCase()}</div>
          </div>
        </div>

        <div className="scamalytics-header-actions">
          <div className={`scamalytics-status-badge ${statusBadge.className}`}>
            {getStatusIcon()}
            <span>{statusBadge.label}</span>
          </div>
          <a
            href={scamalyticsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="scamalytics-external-link"
          >
            <ExternalLink size={16} />
          </a>
        </div>
      </div>

      {/* Status Description */}
      <div className={`scamalytics-status-description ${status}`}>
        <Info size={16} />
        {details?.risk_description || t('scamalytics.noDescription')}
      </div>

      {/* Content */}
      <div className="scamalytics-content">
        {details?.message ? (
          <div className="scamalytics-info-message">
            <AlertCircle size={18} />
            <span>{details.message}</span>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="scamalytics-stats-grid">
              <div className="scamalytics-stat-item">
                <span className="scamalytics-stat-label">{t('scamalytics.fraudScore')}</span>
                <span className="scamalytics-stat-value" style={{ color: riskColor }}>{score}</span>
              </div>
              <div className="scamalytics-stat-item">
                <span className="scamalytics-stat-label">{t('scamalytics.riskLevel')}</span>
                <span className="scamalytics-stat-value" style={{ color: riskColor }}>
                  {risk.charAt(0).toUpperCase() + risk.slice(1)}
                </span>
              </div>
              {ispScore !== undefined && (
                <div className="scamalytics-stat-item">
                  <span className="scamalytics-stat-label">{t('scamalytics.ispScore')}</span>
                  <span className="scamalytics-stat-value">{ispScore}</span>
                </div>
              )}
              <div className="scamalytics-stat-item">
                <span className="scamalytics-stat-label">{t('scamalytics.blacklisted')}</span>
                <span className={`scamalytics-stat-value ${isBlacklisted ? 'danger' : 'success'}`}>
                  {isBlacklisted ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            {/* Fraud Indicators */}
            {fraudIndicators.length > 0 && (
              <div className="scamalytics-indicators-section">
                <div className="scamalytics-section-title">
                  <Eye size={16} />
                  <span>{t('scamalytics.indicators')}</span>
                </div>
                <div className="scamalytics-tags">
                  {fraudIndicators.map((indicator: string, index: number) => (
                    <span key={index} className="scamalytics-tag warning">
                      {indicator}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Proxy Detection */}
            {Object.keys(proxyInfo).some(key => proxyInfo[key]) && (
              <div className="scamalytics-overview-grid">
                <div className="scamalytics-metric-card full-width">
                  <div className="scamalytics-metric-header">
                    <Server size={18} />
                    <span>{t('scamalytics.proxyDetection')}</span>
                  </div>
                  <div className="scamalytics-metric-body">
                    {proxyInfo.is_datacenter && (
                      <div className="scamalytics-metric-item">
                        <span className="scamalytics-metric-label">Datacenter</span>
                        <span className="scamalytics-metric-value warning">Yes</span>
                      </div>
                    )}
                    {proxyInfo.is_vpn && (
                      <div className="scamalytics-metric-item">
                        <span className="scamalytics-metric-label">VPN</span>
                        <span className="scamalytics-metric-value warning">Yes</span>
                      </div>
                    )}
                    {proxyInfo.is_tor && (
                      <div className="scamalytics-metric-item">
                        <span className="scamalytics-metric-label">Tor Exit Node</span>
                        <span className="scamalytics-metric-value danger">Yes</span>
                      </div>
                    )}
                    {proxyInfo.is_apple_icloud_private_relay && (
                      <div className="scamalytics-metric-item">
                        <span className="scamalytics-metric-label">iCloud Private Relay</span>
                        <span className="scamalytics-metric-value">Yes</span>
                      </div>
                    )}
                    {proxyInfo.is_amazon_aws && (
                      <div className="scamalytics-metric-item">
                        <span className="scamalytics-metric-label">Amazon AWS</span>
                        <span className="scamalytics-metric-value">Yes</span>
                      </div>
                    )}
                    {proxyInfo.is_google && (
                      <div className="scamalytics-metric-item">
                        <span className="scamalytics-metric-label">Google</span>
                        <span className="scamalytics-metric-value">Yes</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* External Link */}
            <div className="scamalytics-link-container">
              <a
                href={scamalyticsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="scamalytics-link-button"
              >
                <ExternalLink size={14} />
                {t('scamalytics.viewFullReport')}
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
