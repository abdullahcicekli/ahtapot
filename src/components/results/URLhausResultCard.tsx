import React from 'react';
import { IOCAnalysisResult } from '@/types/ioc';
import { AlertCircle, AlertTriangle, CheckCircle, ExternalLink, FileText, Globe } from 'lucide-react';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import './ResultCard.css';

interface URLhausResultCardProps {
  result: IOCAnalysisResult;
}

export const URLhausResultCard: React.FC<URLhausResultCardProps> = ({ result }) => {
  const { t } = useTranslation('results');
  const { details, status } = result;

  const getStatusIcon = () => {
    if (status === 'malicious') return <AlertCircle className="status-icon malicious" />;
    if (status === 'suspicious') return <AlertTriangle className="status-icon suspicious" />;
    return <CheckCircle className="status-icon safe" />;
  };

  const urlhausRef = details?.urlhaus_reference;

  return (
    <div className="result-card">
      <div className="result-card-header">
        <div className="result-card-title">
          {getStatusIcon()}
          <span>{t('urlhaus.title')}</span>
        </div>
        {urlhausRef && (
          <a
            href={urlhausRef}
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
            {details?.url_status && (
              <div className="info-row">
                <Globe size={16} />
                <span><strong>{t('urlhaus.urlStatus')}:</strong> {details.url_status}</span>
              </div>
            )}
            {details?.threat && (
              <div className="info-row">
                <AlertTriangle size={16} />
                <span><strong>{t('urlhaus.threat')}:</strong> {details.threat}</span>
              </div>
            )}
            {details?.url_count && (
              <div className="info-row">
                <FileText size={16} />
                <span><strong>{t('urlhaus.urlCount')}:</strong> {details.url_count}</span>
              </div>
            )}
            {details?.online_count !== undefined && (
              <div className="info-row">
                <AlertCircle size={16} />
                <span><strong>{t('urlhaus.onlineCount')}:</strong> {details.online_count}</span>
              </div>
            )}
            {details?.tags && details.tags.length > 0 && (
              <div className="tags">
                {details.tags.map((tag: string, index: number) => (
                  <span key={index} className="tag">{tag}</span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
