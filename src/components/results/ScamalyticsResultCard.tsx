import React from 'react';
import { IOCAnalysisResult } from '@/types/ioc';
import { AlertCircle, AlertTriangle, CheckCircle, ExternalLink, Shield } from 'lucide-react';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import './ResultCard.css';

interface ScamalyticsResultCardProps {
  result: IOCAnalysisResult;
}

export const ScamalyticsResultCard: React.FC<ScamalyticsResultCardProps> = ({ result }) => {
  const { t } = useTranslation('results');
  const { details, status, ioc } = result;

  const getStatusIcon = () => {
    if (status === 'malicious') return <AlertCircle className="status-icon malicious" />;
    if (status === 'suspicious') return <AlertTriangle className="status-icon suspicious" />;
    return <CheckCircle className="status-icon safe" />;
  };

  const score = details?.score || 0;
  const risk = details?.risk || 'very low';

  const getRiskColor = (risk: string) => {
    if (risk === 'very high' || risk === 'high') return '#ef4444';
    if (risk === 'medium') return '#eab308';
    return '#22c55e';
  };

  return (
    <div className="result-card">
      <div className="result-card-header">
        <div className="result-card-title">
          {getStatusIcon()}
          <span>{t('scamalytics.title')}</span>
        </div>
        <a
          href={`https://scamalytics.com/ip/${ioc.value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="external-link"
        >
          <ExternalLink size={16} />
        </a>
      </div>

      <div className="result-card-body">
        <div className="score-display">
          <div className="score-circle" style={{ borderColor: getRiskColor(risk) }}>
            <div className="score-value">{score}</div>
            <div className="score-max">/100</div>
          </div>
          <div className="score-info">
            <div className="risk-level" style={{ color: getRiskColor(risk), textTransform: 'capitalize' }}>
              {risk}
            </div>
            <div className="score-label">{t('scamalytics.fraudScore')}</div>
          </div>
        </div>

        {details?.risk_description && (
          <div className="info-row">
            <Shield size={16} />
            <span>{details.risk_description}</span>
          </div>
        )}

        {details?.entries && details.entries.length > 0 && (
          <div className="info-section">
            <div className="section-title">{t('scamalytics.indicators')}</div>
            {details.entries.map((entry: any, index: number) => (
              <div key={index} className="info-row">
                <AlertCircle size={14} />
                <span><strong>{entry.type}:</strong> {entry.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
