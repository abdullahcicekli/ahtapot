import React from 'react';
import { IOCAnalysisResult } from '@/types/ioc';
import { AlertCircle, AlertTriangle, CheckCircle, ExternalLink, Shield, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import './ResultCard.css';

interface PulsediveResultCardProps {
  result: IOCAnalysisResult;
}

export const PulsediveResultCard: React.FC<PulsediveResultCardProps> = ({ result }) => {
  const { t } = useTranslation('results');
  const { details, status } = result;

  const getStatusIcon = () => {
    if (status === 'malicious') return <AlertCircle className="status-icon malicious" />;
    if (status === 'suspicious') return <AlertTriangle className="status-icon suspicious" />;
    return <CheckCircle className="status-icon safe" />;
  };

  const risk = details?.risk || 'unknown';
  const getRiskColor = (risk: string) => {
    if (risk === 'critical' || risk === 'high') return '#ef4444';
    if (risk === 'medium') return '#eab308';
    if (risk === 'low') return '#3b82f6';
    return '#22c55e';
  };

  const iid = details?.iid;

  return (
    <div className="result-card">
      <div className="result-card-header">
        <div className="result-card-title">
          {getStatusIcon()}
          <span>{t('pulsedive.title')}</span>
        </div>
        {iid && (
          <a
            href={`https://pulsedive.com/indicator/?iid=${iid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="external-link"
          >
            <ExternalLink size={16} />
          </a>
        )}
      </div>

      <div className="result-card-body">
        {details?.message ? (
          <p className="info-message">{details.message}</p>
        ) : (
          <>
            <div className="info-row">
              <Shield size={16} />
              <span>
                <strong>{t('pulsedive.risk')}:</strong>{' '}
                <span style={{ color: getRiskColor(risk), fontWeight: 'bold', textTransform: 'capitalize' }}>
                  {risk}
                </span>
              </span>
            </div>

            {details?.threats && details.threats.length > 0 && (
              <div className="info-section">
                <div className="section-title">{t('pulsedive.threats')}</div>
                <div className="threat-list">
                  {details.threats.slice(0, 5).map((threat: any, index: number) => (
                    <div key={index} className="threat-item">
                      <span className="threat-name">{threat.name}</span>
                      <span className="threat-category">{threat.category}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {details?.riskfactors && details.riskfactors.length > 0 && (
              <div className="info-section">
                <div className="section-title">{t('pulsedive.riskFactors')}</div>
                {details.riskfactors.slice(0, 3).map((factor: any, index: number) => (
                  <div key={index} className="info-row">
                    <TrendingUp size={14} />
                    <span>{factor.description}</span>
                  </div>
                ))}
              </div>
            )}

            {details?.feeds && details.feeds.length > 0 && (
              <div className="info-row">
                <span><strong>{t('pulsedive.feeds')}:</strong> {details.feeds.length}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
