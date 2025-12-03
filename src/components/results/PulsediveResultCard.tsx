import React from 'react';
import { IOCAnalysisResult } from '@/types/ioc';
import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink, 
  Shield, 
  Building, 
  Clock, 
  Globe, 
  HelpCircle,
  Info,
  Tag,
  Activity
} from 'lucide-react';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import './PulsediveResultCard.css';

interface PulsediveResultCardProps {
  result: IOCAnalysisResult;
}

export const PulsediveResultCard: React.FC<PulsediveResultCardProps> = ({ result }) => {
  const { t } = useTranslation('results');
  const { details } = result;

  const risk = details?.risk || details?.risk_recommended || 'unknown';
  
  const getRiskColor = (risk: string) => {
    const riskLower = risk.toLowerCase();
    if (riskLower === 'critical') return '#dc2626';
    if (riskLower === 'high') return '#ef4444';
    if (riskLower === 'medium') return '#f97316';
    if (riskLower === 'low') return '#3b82f6';
    if (riskLower === 'none') return '#22c55e';
    return '#6b7280';
  };

  const getRiskIcon = () => {
    const riskLower = risk.toLowerCase();
    if (riskLower === 'critical' || riskLower === 'high') return <AlertCircle size={28} />;
    if (riskLower === 'medium') return <AlertTriangle size={28} />;
    if (riskLower === 'low' || riskLower === 'none') return <Shield size={28} />;
    return <HelpCircle size={28} />;
  };

  const getStatusBadge = () => {
    const riskLower = risk.toLowerCase();
    if (riskLower === 'critical') return { label: t('pulsedive.status.critical'), className: 'critical', icon: <AlertCircle size={16} /> };
    if (riskLower === 'high') return { label: t('pulsedive.status.high'), className: 'high', icon: <AlertCircle size={16} /> };
    if (riskLower === 'medium') return { label: t('pulsedive.status.medium'), className: 'medium', icon: <AlertTriangle size={16} /> };
    if (riskLower === 'low') return { label: t('pulsedive.status.low'), className: 'low', icon: <Shield size={16} /> };
    if (riskLower === 'none') return { label: t('pulsedive.status.clean'), className: 'clean', icon: <CheckCircle size={16} /> };
    return { label: t('pulsedive.status.unknown'), className: 'unknown', icon: <HelpCircle size={16} /> };
  };

  const iid = details?.iid;
  const geo = details?.properties?.geo;
  const whois = details?.properties?.whois;
  const statusBadge = getStatusBadge();
  const riskColor = getRiskColor(risk);

  return (
    <div className="pulsedive-result-card">
      {/* Header */}
      <div className="pulsedive-header">
        <div className="pulsedive-header-left">
          <div 
            className="pulsedive-risk-circle"
            style={{ '--risk-color': riskColor } as React.CSSProperties}
          >
            <div className="pulsedive-risk-icon">
              {getRiskIcon()}
            </div>
            <div className="pulsedive-risk-label-small">Risk</div>
          </div>
          <div className="pulsedive-risk-info">
            <div className="pulsedive-risk-title">{t('pulsedive.title')}</div>
            <div className="pulsedive-risk-value" style={{ color: riskColor }}>
              {risk.charAt(0).toUpperCase() + risk.slice(1)}
            </div>
          </div>
        </div>

        <div className="pulsedive-header-right">
          <div className="pulsedive-ioc-info">
            <div className="pulsedive-ioc-value">{result.ioc.value}</div>
            <div className="pulsedive-ioc-type">{result.ioc.type.toUpperCase()}</div>
          </div>
        </div>

        <div className="pulsedive-header-actions">
          <div className={`pulsedive-status-badge ${statusBadge.className}`}>
            {statusBadge.icon}
            <span>{statusBadge.label}</span>
          </div>
          {iid && (
            <a
              href={`https://pulsedive.com/indicator/?iid=${iid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="pulsedive-external-link"
            >
              <ExternalLink size={16} />
            </a>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="pulsedive-content">
        {details?.message ? (
          <div className="pulsedive-info-message">
            <Info size={18} />
            <span>{details.message}</span>
          </div>
        ) : (
          <div className="pulsedive-overview-grid">
            {/* Location Information */}
            {(geo || whois) && (
              <div className="pulsedive-metric-card">
                <div className="pulsedive-metric-header">
                  <Globe size={18} />
                  <span>{t('pulsedive.location')}</span>
                </div>
                <div className="pulsedive-metric-body">
                  {geo?.country && (
                    <div className="pulsedive-metric-item">
                      <span className="pulsedive-metric-label">{t('pulsedive.country')}</span>
                      <span className="pulsedive-metric-value">
                        {geo.city ? `${geo.city}, ` : ''}{geo.country}
                        {geo.countrycode ? ` (${geo.countrycode})` : ''}
                      </span>
                    </div>
                  )}
                  {geo?.region && (
                    <div className="pulsedive-metric-item">
                      <span className="pulsedive-metric-label">{t('pulsedive.region')}</span>
                      <span className="pulsedive-metric-value">{geo.region}</span>
                    </div>
                  )}
                  {geo?.asn && (
                    <div className="pulsedive-metric-item">
                      <span className="pulsedive-metric-label">ASN</span>
                      <span className="pulsedive-metric-value monospace">{geo.asn}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Organization Information */}
            {(geo?.org || whois?.['org-name']) && (
              <div className="pulsedive-metric-card">
                <div className="pulsedive-metric-header">
                  <Building size={18} />
                  <span>{t('pulsedive.org')}</span>
                </div>
                <div className="pulsedive-metric-body">
                  <div className="pulsedive-metric-item">
                    <span className="pulsedive-metric-label">{t('pulsedive.orgName')}</span>
                    <span className="pulsedive-metric-value">
                      {Array.isArray(geo?.org) ? geo.org[0] : (geo?.org || whois?.['org-name'])}
                    </span>
                  </div>
                  {whois?.netname && (
                    <div className="pulsedive-metric-item">
                      <span className="pulsedive-metric-label">{t('pulsedive.netname')}</span>
                      <span className="pulsedive-metric-value">{whois.netname}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timestamps */}
            {(details?.stamp_added || details?.stamp_updated || details?.stamp_seen) && (
              <div className="pulsedive-metric-card">
                <div className="pulsedive-metric-header">
                  <Clock size={18} />
                  <span>{t('pulsedive.timestamps')}</span>
                </div>
                <div className="pulsedive-metric-body">
                  {details?.stamp_added && (
                    <div className="pulsedive-metric-item">
                      <span className="pulsedive-metric-label">{t('pulsedive.firstSeen')}</span>
                      <span className="pulsedive-metric-value">{details.stamp_added.split(' ')[0]}</span>
                    </div>
                  )}
                  {details?.stamp_updated && (
                    <div className="pulsedive-metric-item">
                      <span className="pulsedive-metric-label">{t('pulsedive.lastUpdated')}</span>
                      <span className="pulsedive-metric-value">{details.stamp_updated.split(' ')[0]}</span>
                    </div>
                  )}
                  {details?.stamp_seen && (
                    <div className="pulsedive-metric-item">
                      <span className="pulsedive-metric-label">{t('pulsedive.lastSeen')}</span>
                      <span className="pulsedive-metric-value">{details.stamp_seen.split(' ')[0]}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Threats */}
            {details?.threats && details.threats.length > 0 && (
              <div className="pulsedive-metric-card full-width">
                <div className="pulsedive-metric-header">
                  <AlertTriangle size={18} />
                  <span>{t('pulsedive.threats')}</span>
                </div>
                <div className="pulsedive-threat-list">
                  {details.threats.slice(0, 5).map((threat: any, index: number) => (
                    <div key={index} className="pulsedive-threat-item">
                      <span className="pulsedive-threat-name">{threat.name}</span>
                      {threat.category && (
                        <span className="pulsedive-threat-category">{threat.category}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risk Factors */}
            {details?.riskfactors && details.riskfactors.length > 0 && (
              <div className="pulsedive-metric-card full-width">
                <div className="pulsedive-metric-header">
                  <Activity size={18} />
                  <span>{t('pulsedive.riskFactors')}</span>
                </div>
                <div className="pulsedive-tags">
                  {details.riskfactors.slice(0, 8).map((factor: any, index: number) => (
                    <span key={index} className="pulsedive-tag threat">
                      {factor.description || factor.risk || factor}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Feeds */}
            {details?.feeds && details.feeds.length > 0 && (
              <div className="pulsedive-metric-card full-width">
                <div className="pulsedive-metric-header">
                  <Tag size={18} />
                  <span>{t('pulsedive.feeds')}</span>
                </div>
                <div className="pulsedive-tags">
                  {details.feeds.slice(0, 8).map((feed: any, index: number) => (
                    <span key={index} className="pulsedive-tag feed">
                      {feed.name || feed}
                    </span>
                  ))}
                  {details.feeds.length > 8 && (
                    <span className="pulsedive-tag">+{details.feeds.length - 8}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* External Link */}
        {iid && !details?.message && (
          <div className="pulsedive-link-container">
            <a
              href={`https://pulsedive.com/indicator/?iid=${iid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="pulsedive-link-button"
            >
              <ExternalLink size={14} />
              {t('pulsedive.viewFullReport')}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
