import React from 'react';
import { IOCAnalysisResult } from '@/types/ioc';
import { getIOCTypeLabel } from '@/utils/ioc-detector';
import {
  AlertTriangle,
  Info,
  Shield,
  Eye,
  Tag,
  Globe,
  Building2,
  Clock,
  AlertCircle,
  CheckCircle,
  Network,
} from 'lucide-react';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import './GreyNoiseResultCard.css';

interface GreyNoiseResultCardProps {
  result: IOCAnalysisResult;
}

export const GreyNoiseResultCard: React.FC<GreyNoiseResultCardProps> = ({ result }) => {
  const { t } = useTranslation('results');
  const { details, status, error: resultError } = result;

  const getStatusIcon = () => {
    switch (status) {
      case 'safe':
        return <Shield size={16} />;
      case 'suspicious':
        return <AlertCircle size={16} />;
      case 'malicious':
        return <AlertTriangle size={16} />;
      default:
        return <Info size={16} />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'safe':
        return t('greynoise.status.benign');
      case 'suspicious':
        return t('greynoise.status.suspicious');
      case 'malicious':
        return t('greynoise.status.malicious');
      case 'error':
        return resultError || details?.error || t('greynoise.status.error');
      default:
        return t('greynoise.status.unknown');
    }
  };

  const getClassificationBadgeClass = (classification: string) => {
    switch (classification) {
      case 'benign':
        return 'benign';
      case 'malicious':
        return 'malicious';
      case 'unknown':
        return 'unknown';
      default:
        return 'unknown';
    }
  };

  return (
    <div className="greynoise-result-card">
      {/* Header */}
      <div className="greynoise-header">
        <div className="greynoise-header-left">
          <div className="greynoise-logo">
            <img src="/provider-icons/greynoise-logo.png" alt="GreyNoise" />
          </div>
          <div className="greynoise-info">
            <div className="greynoise-title">{t('greynoise.title')}</div>
            <div className="greynoise-subtitle">{t('greynoise.subtitle')}</div>
          </div>
        </div>

        <div className="greynoise-header-right">
          <div className="greynoise-ioc-info">
            <div className="greynoise-ioc-value">{result.ioc.value}</div>
            <div className="greynoise-ioc-type">{getIOCTypeLabel(result.ioc.type)}</div>
          </div>
        </div>

        <div className="greynoise-header-actions">
          <div className={`greynoise-status-badge ${status}`}>
            {getStatusIcon()}
            <span>{getStatusText()}</span>
          </div>
        </div>
      </div>

      {/* Unsupported IOC Type */}
      {result.unsupportedReason && result.supportedTypes && (
        <div className="greynoise-unsupported">
          <div className="greynoise-unsupported-message">
            <AlertTriangle size={16} />
            <span>{result.unsupportedReason}</span>
          </div>
          <div className="greynoise-supported-types">
            <span className="greynoise-supported-label">{t('greynoise.unsupportedType')}</span>
            <div className="greynoise-supported-badges">
              {result.supportedTypes.map((type, idx) => (
                <span key={idx} className="greynoise-ioc-badge">
                  {getIOCTypeLabel(type)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Not Seen by GreyNoise Message */}
      {details?.message && details?.note && (
        <div className="greynoise-not-seen">
          <div className="greynoise-not-seen-icon">
            <Eye size={20} />
          </div>
          <div className="greynoise-not-seen-content">
            <div className="greynoise-not-seen-title">{details.message}</div>
            <div className="greynoise-not-seen-note">{details.note}</div>
          </div>
        </div>
      )}

      {/* Quick Summary */}
      {details?.summary && !details?.message && (
        <div className="greynoise-summary">
          <Info size={16} />
          <span>{details.summary}</span>
        </div>
      )}

      {/* Content - IP Seen by GreyNoise */}
      {!details?.message && details?.ip && details?.seen && (
        <div className="greynoise-content">
          <div className="greynoise-overview-grid">
            {/* Classification Card */}
            <div className="greynoise-metric-card">
              <div className="greynoise-metric-header">
                <Eye size={18} />
                <span>{t('greynoise.classification')}</span>
              </div>
              <div className="greynoise-metric-body">
                <div className="greynoise-metric-item">
                  <span className="greynoise-metric-label">{t('greynoise.classificationStatus')}</span>
                  <span className={`greynoise-classification-badge ${getClassificationBadgeClass(details.classification)}`}>
                    {details.classification}
                  </span>
                </div>
                <div className="greynoise-metric-item">
                  <span className="greynoise-metric-label">{t('greynoise.seenByGreyNoise')}</span>
                  <span className="greynoise-metric-value">
                    {details.seen ? (
                      <span className="greynoise-seen-yes"><CheckCircle size={14} /> {t('greynoise.yes')}</span>
                    ) : (
                      <span className="greynoise-seen-no">{t('greynoise.no')}</span>
                    )}
                  </span>
                </div>
                {details.actor && (
                  <div className="greynoise-metric-item">
                    <span className="greynoise-metric-label">{t('greynoise.actor')}</span>
                    <span className="greynoise-metric-value greynoise-actor">{details.actor}</span>
                  </div>
                )}
                {details.isRiot && details.riotName && (
                  <div className="greynoise-metric-item">
                    <span className="greynoise-metric-label">{t('greynoise.knownService')}</span>
                    <span className="greynoise-riot-badge">
                      <CheckCircle size={14} /> {details.riotName}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Location & Organization */}
            <div className="greynoise-metric-card">
              <div className="greynoise-metric-header">
                <Building2 size={18} />
                <span>{t('greynoise.locationOrganization')}</span>
              </div>
              <div className="greynoise-metric-body">
                {details.country && (
                  <div className="greynoise-metric-item">
                    <span className="greynoise-metric-label">{t('greynoise.country')}</span>
                    <span className="greynoise-metric-value">
                      {details.countryCode && `${details.countryCode} - `}{details.country}
                    </span>
                  </div>
                )}
                {details.city && (
                  <div className="greynoise-metric-item">
                    <span className="greynoise-metric-label">{t('greynoise.city')}</span>
                    <span className="greynoise-metric-value">{details.city}</span>
                  </div>
                )}
                {details.organization && (
                  <div className="greynoise-metric-item">
                    <span className="greynoise-metric-label">{t('greynoise.organization')}</span>
                    <span className="greynoise-metric-value">{details.organization}</span>
                  </div>
                )}
                {details.asn && (
                  <div className="greynoise-metric-item">
                    <span className="greynoise-metric-label">{t('greynoise.asn')}</span>
                    <span className="greynoise-metric-value monospace">{details.asn}</span>
                  </div>
                )}
                {details.rdns && (
                  <div className="greynoise-metric-item">
                    <span className="greynoise-metric-label">{t('greynoise.reverseDns')}</span>
                    <span className="greynoise-metric-value monospace">{details.rdns}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Activity Timeline */}
            {(details.firstSeen || details.lastSeen) && (
              <div className="greynoise-metric-card full-width">
                <div className="greynoise-metric-header">
                  <Clock size={18} />
                  <span>{t('greynoise.activityTimeline')}</span>
                </div>
                <div className="greynoise-metric-body">
                  {details.firstSeen && (
                    <div className="greynoise-metric-item">
                      <span className="greynoise-metric-label">{t('greynoise.firstSeen')}</span>
                      <span className="greynoise-metric-value">
                        {new Date(details.firstSeen).toLocaleDateString()} {new Date(details.firstSeen).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                  {details.lastSeen && (
                    <div className="greynoise-metric-item">
                      <span className="greynoise-metric-label">{t('greynoise.lastSeen')}</span>
                      <span className="greynoise-metric-value">
                        {new Date(details.lastSeen).toLocaleDateString()} {new Date(details.lastSeen).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {details.tags && details.tags.length > 0 && (
              <div className="greynoise-metric-card full-width">
                <div className="greynoise-metric-header">
                  <Tag size={18} />
                  <span>{t('greynoise.behaviorTags', { count: details.tags.length })}</span>
                </div>
                <div className="greynoise-tags">
                  {details.tags.map((tag: string, index: number) => (
                    <span key={index} className="greynoise-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Security Indicators */}
            {(details.isTor || details.isVPN || details.isProxy) && (
              <div className="greynoise-metric-card full-width">
                <div className="greynoise-metric-header">
                  <Network size={18} />
                  <span>{t('greynoise.securityIndicators')}</span>
                </div>
                <div className="greynoise-indicators">
                  {details.isTor && (
                    <span className="greynoise-indicator-badge tor">
                      <Shield size={14} /> {t('greynoise.torExitNode')}
                    </span>
                  )}
                  {details.isVPN && (
                    <span className="greynoise-indicator-badge vpn">
                      <Shield size={14} /> {t('greynoise.vpn')}
                    </span>
                  )}
                  {details.isProxy && (
                    <span className="greynoise-indicator-badge proxy">
                      <Shield size={14} /> {t('greynoise.proxy')}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* View on GreyNoise Link */}
          <div className="greynoise-external-link">
            <a
              href={details.link || `https://viz.greynoise.io/ip/${result.ioc.value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="greynoise-link-button"
            >
              <Globe size={16} />
              {t('greynoise.viewFullReport')}
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
