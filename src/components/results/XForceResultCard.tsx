import React from 'react';
import { IOCAnalysisResult } from '@/types/ioc';
import { AlertCircle, AlertTriangle, CheckCircle, ExternalLink, Globe, Shield } from 'lucide-react';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import './ResultCard.css';

interface XForceResultCardProps {
  result: IOCAnalysisResult;
}

export const XForceResultCard: React.FC<XForceResultCardProps> = ({ result }) => {
  const { t } = useTranslation('results');
  const { details, status } = result;

  const getStatusIcon = () => {
    if (status === 'malicious') return <AlertCircle className="status-icon malicious" />;
    if (status === 'suspicious') return <AlertTriangle className="status-icon suspicious" />;
    return <CheckCircle className="status-icon safe" />;
  };

  const score = details?.score || 0;
  const riskLevel = details?.risk_level || 'Unknown';

  return (
    <div className="result-card">
      <div className="result-card-header">
        <div className="result-card-title">
          {getStatusIcon()}
          <span>{t('xforce.title')}</span>
        </div>
        <a
          href={`https://exchange.xforce.ibmcloud.com/`}
          target="_blank"
          rel="noopener noreferrer"
          className="external-link"
        >
          <ExternalLink size={16} />
        </a>
      </div>

      <div className="result-card-body">
        {details?.message ? (
          <p className="info-message">{details.message}</p>
        ) : (
          <>
            <div className="score-display">
              <div className="score-circle" style={{ borderColor: score >= 7 ? '#ef4444' : score >= 4 ? '#eab308' : '#22c55e' }}>
                <div className="score-value">{score}</div>
                <div className="score-max">/10</div>
              </div>
              <div className="score-info">
                <div className="risk-level">{riskLevel}</div>
                <div className="score-label">{t('xforce.riskScore')}</div>
              </div>
            </div>

            {details?.geo && (
              <div className="info-row">
                <Globe size={16} />
                <span><strong>{t('xforce.location')}:</strong> {details.geo.country}</span>
              </div>
            )}

            {details?.categories && Object.keys(details.categories).length > 0 && (
              <div className="info-section">
                <div className="section-title">{t('xforce.categories')}</div>
                <div className="tags">
                  {Object.keys(details.categories).map((cat, index) => (
                    <span key={index} className="tag">{cat}</span>
                  ))}
                </div>
              </div>
            )}

            {details?.reason && (
              <div className="info-row">
                <Shield size={16} />
                <span><strong>{t('xforce.reason')}:</strong> {details.reason}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
