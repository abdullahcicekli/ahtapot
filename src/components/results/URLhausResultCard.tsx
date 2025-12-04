import React, { useRef } from 'react';
import { IOCAnalysisResult } from '@/types/ioc';
import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink, 
  Clock, 
  Link2, 
  Shield, 
  XCircle,
  Tag
} from 'lucide-react';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import { ResultCopyButtons, formatURLhausResults } from './ResultCopyButtons';
import './URLhausResultCard.css';

interface URLhausResultCardProps {
  result: IOCAnalysisResult;
}

export const URLhausResultCard: React.FC<URLhausResultCardProps> = ({ result }) => {
  const { t } = useTranslation('results');
  const cardRef = useRef<HTMLDivElement>(null);
  const { details } = result;

  const urlhausRef = details?.urlhaus_reference;
  const urls = details?.urls || [];
  const onlineCount = urls.filter((u: any) => u.url_status === 'online').length;
  const offlineCount = urls.filter((u: any) => u.url_status === 'offline').length;
  const urlCount = parseInt(details?.url_count) || urls.length;

  // Collect all unique tags from URLs
  const allTags = new Set<string>();
  urls.forEach((url: any) => {
    if (url.tags) {
      url.tags.forEach((tag: string) => allTags.add(tag));
    }
  });

  // Collect all unique threats
  const allThreats = new Set<string>();
  urls.forEach((url: any) => {
    if (url.threat) {
      allThreats.add(url.threat);
    }
  });

  // Check blacklist status
  const isBlacklisted = details?.blacklists && 
    (details.blacklists.spamhaus_dbl !== 'not listed' || details.blacklists.surbl !== 'not listed');

  const getStatusColor = () => {
    if (onlineCount > 0) return '#E63946';
    if (urlCount > 0) return '#FBBF24';
    return '#4ADE80';
  };

  const getStatusInfo = () => {
    if (onlineCount > 0) {
      return {
        icon: <XCircle size={16} />,
        label: t('urlhaus.status.malicious'),
        className: 'malicious',
        description: t('urlhaus.statusDescription.malicious', { count: onlineCount })
      };
    }
    if (urlCount > 0) {
      return {
        icon: <AlertTriangle size={16} />,
        label: t('urlhaus.status.suspicious'),
        className: 'suspicious',
        description: t('urlhaus.statusDescription.suspicious', { count: urlCount })
      };
    }
    return {
      icon: <CheckCircle size={16} />,
      label: t('urlhaus.status.clean'),
      className: 'clean',
      description: t('urlhaus.statusDescription.clean')
    };
  };

  const statusInfo = getStatusInfo();
  const statusColor = getStatusColor();

  return (
    <div className="urlhaus-result-card" ref={cardRef}>
      {/* External Link - Top Right */}
      <a
        href={urlhausRef || `https://urlhaus.abuse.ch/browse.php?search=${encodeURIComponent(result.ioc.value)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="card-external-link"
        title="View on URLhaus"
      >
        <ExternalLink size={16} />
      </a>
      {/* Header */}
      <div className="urlhaus-header">
        <div className="urlhaus-header-left">
          <div 
            className="urlhaus-stats-circle"
            style={{ '--status-color': statusColor } as React.CSSProperties}
          >
            <div className="urlhaus-stats-value">{urlCount}</div>
            <div className="urlhaus-stats-label-small">URLs</div>
          </div>
          <div className="urlhaus-stats-info">
            <div className="urlhaus-stats-title">{t('urlhaus.title')}</div>
            <div className="urlhaus-stats-breakdown">
              <span className="urlhaus-online">{onlineCount} {t('urlhaus.online')}</span>
              <span className="urlhaus-offline">{offlineCount} {t('urlhaus.offline')}</span>
            </div>
          </div>
        </div>

        <div className="urlhaus-header-right">
          <div className="urlhaus-ioc-info">
            <div className="urlhaus-ioc-value">{result.ioc.value}</div>
            <div className="urlhaus-ioc-type">{result.ioc.type.toUpperCase()}</div>
          </div>
        </div>

        <div className="urlhaus-header-actions">
          <div className={`urlhaus-status-badge ${statusInfo.className}`}>
            {statusInfo.icon}
            <span>{statusInfo.label}</span>
          </div>
          {urlhausRef && (
            <a
              href={urlhausRef}
              target="_blank"
              rel="noopener noreferrer"
              className="urlhaus-external-link"
            >
              <ExternalLink size={16} />
            </a>
          )}
        </div>
      </div>

      {/* Status Description */}
      <div className={`urlhaus-status-description ${statusInfo.className}`}>
        <AlertCircle size={16} />
        {statusInfo.description}
      </div>

      {/* Content */}
      <div className="urlhaus-content">
        {details?.message ? (
          <div className="urlhaus-info-message">
            <CheckCircle size={18} />
            <span>{details.message}</span>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="urlhaus-stats-grid">
              <div className="urlhaus-stat-item">
                <span className="urlhaus-stat-label">{t('urlhaus.urlCount')}</span>
                <span className="urlhaus-stat-value">{urlCount}</span>
              </div>
              <div className="urlhaus-stat-item">
                <span className="urlhaus-stat-label">{t('urlhaus.onlineCount')}</span>
                <span className={`urlhaus-stat-value ${onlineCount > 0 ? 'danger' : 'success'}`}>
                  {onlineCount}
                </span>
              </div>
              <div className="urlhaus-stat-item">
                <span className="urlhaus-stat-label">{t('urlhaus.offlineCount')}</span>
                <span className="urlhaus-stat-value">{offlineCount}</span>
              </div>
              <div className="urlhaus-stat-item">
                <span className="urlhaus-stat-label">{t('urlhaus.blacklists')}</span>
                <span className={`urlhaus-stat-value ${isBlacklisted ? 'danger' : 'success'}`}>
                  {isBlacklisted ? 'Listed' : 'Clean'}
                </span>
              </div>
            </div>

            {/* Overview Grid */}
            <div className="urlhaus-overview-grid">
              {/* First Seen & Reporter */}
              {(details?.firstseen || details?.reporter) && (
                <div className="urlhaus-metric-card">
                  <div className="urlhaus-metric-header">
                    <Clock size={18} />
                    <span>{t('urlhaus.details')}</span>
                  </div>
                  <div className="urlhaus-metric-body">
                    {details?.firstseen && (
                      <div className="urlhaus-metric-item">
                        <span className="urlhaus-metric-label">{t('urlhaus.firstSeen')}</span>
                        <span className="urlhaus-metric-value">{details.firstseen}</span>
                      </div>
                    )}
                    {details?.reporter && (
                      <div className="urlhaus-metric-item">
                        <span className="urlhaus-metric-label">{t('urlhaus.reporter')}</span>
                        <span className="urlhaus-metric-value">{details.reporter}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Blacklist Status */}
              {details?.blacklists && (
                <div className="urlhaus-metric-card">
                  <div className="urlhaus-metric-header">
                    <Shield size={18} />
                    <span>{t('urlhaus.blacklistStatus')}</span>
                  </div>
                  <div className="urlhaus-metric-body">
                    <div className="urlhaus-metric-item">
                      <span className="urlhaus-metric-label">Spamhaus DBL</span>
                      <span className={`urlhaus-metric-value ${details.blacklists.spamhaus_dbl !== 'not listed' ? 'danger' : 'success'}`}>
                        {details.blacklists.spamhaus_dbl === 'not listed' ? 'Clean' : details.blacklists.spamhaus_dbl}
                      </span>
                    </div>
                    <div className="urlhaus-metric-item">
                      <span className="urlhaus-metric-label">SURBL</span>
                      <span className={`urlhaus-metric-value ${details.blacklists.surbl !== 'not listed' ? 'danger' : 'success'}`}>
                        {details.blacklists.surbl === 'not listed' ? 'Clean' : details.blacklists.surbl}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Threats */}
            {allThreats.size > 0 && (
              <div className="urlhaus-tags-section">
                <div className="urlhaus-section-title">
                  <AlertTriangle size={16} />
                  <span>{t('urlhaus.threats')}</span>
                </div>
                <div className="urlhaus-tags">
                  {Array.from(allThreats).map((threat, index) => (
                    <span key={index} className="urlhaus-tag threat">
                      {threat.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {allTags.size > 0 && (
              <div className="urlhaus-tags-section">
                <div className="urlhaus-section-title">
                  <Tag size={16} />
                  <span>{t('urlhaus.tags')}</span>
                </div>
                <div className="urlhaus-tags">
                  {Array.from(allTags).slice(0, 10).map((tag, index) => (
                    <span key={index} className="urlhaus-tag">{tag}</span>
                  ))}
                  {allTags.size > 10 && (
                    <span className="urlhaus-tag">+{allTags.size - 10}</span>
                  )}
                </div>
              </div>
            )}

            {/* Sample URLs */}
            {urls.length > 0 && (
              <div className="urlhaus-urls-section">
                <div className="urlhaus-section-title">
                  <Link2 size={16} />
                  <span>{t('urlhaus.sampleUrls')} ({Math.min(3, urls.length)}/{urls.length})</span>
                </div>
                <div className="urlhaus-url-list">
                  {urls.slice(0, 3).map((url: any, index: number) => (
                    <div 
                      key={index} 
                      className={`urlhaus-url-item ${url.url_status === 'online' ? 'online' : 'offline'}`}
                    >
                      <Link2 size={14} className="urlhaus-url-icon" />
                      <div className="urlhaus-url-content">
                        <span className="urlhaus-url-text">
                          {url.url.length > 80 ? url.url.substring(0, 80) + '...' : url.url}
                        </span>
                        <div className="urlhaus-url-meta">
                          <span className={`urlhaus-url-status ${url.url_status}`}>
                            {url.url_status}
                          </span>
                          {url.date_added && (
                            <span>{url.date_added.split(' ')[0]}</span>
                          )}
                          {url.threat && (
                            <span>{url.threat.replace(/_/g, ' ')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </>
        )}
      </div>

      {/* Copy Buttons */}
      <ResultCopyButtons
        result={result}
        formattedResults={formatURLhausResults(result)}
        cardRef={cardRef}
      />
    </div>
  );
};
