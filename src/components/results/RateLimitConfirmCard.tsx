import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Info } from 'lucide-react';
import './RateLimitConfirmCard.css';

interface RateLimitConfirmCardProps {
  provider: 'greynoise' | 'shodan';
  iocCount: number;
  onConfirm: () => void;
  logoSrc: string;
  providerName: string;
  subtitle: string;
}

export const RateLimitConfirmCard: React.FC<RateLimitConfirmCardProps> = ({
  provider,
  iocCount,
  onConfirm,
  logoSrc,
  providerName,
  subtitle,
}) => {
  const { t } = useTranslation('sidepanel');

  const getRateLimitInfo = () => {
    if (provider === 'greynoise') {
      return {
        limit: t('rateLimitConfirm.greynoise.limit', '50 searches/week'),
        message: t('rateLimitConfirm.greynoise.message'),
        warning: t('rateLimitConfirm.greynoise.warning', { count: iocCount }),
      };
    } else {
      return {
        limit: t('rateLimitConfirm.shodan.limit', '100 results/month'),
        message: t('rateLimitConfirm.shodan.message'),
        warning: t('rateLimitConfirm.shodan.warning', { count: iocCount }),
      };
    }
  };

  const info = getRateLimitInfo();

  return (
    <div className="rate-limit-confirm-card">
      {/* Header */}
      <div className="rate-limit-header">
        <div className="rate-limit-header-left">
          <div className="rate-limit-logo">
            <img src={logoSrc} alt={providerName} />
          </div>
          <div className="rate-limit-info">
            <div className="rate-limit-title">{providerName}</div>
            <div className="rate-limit-subtitle">{subtitle}</div>
          </div>
        </div>
        <div className="rate-limit-status">
          <Info size={16} />
          <span>{t('rateLimitConfirm.pendingStatus')}</span>
        </div>
      </div>

      {/* Confirmation Content */}
      <div className="rate-limit-content">
        <div className="rate-limit-warning-banner">
          <AlertTriangle size={20} />
          <div className="rate-limit-warning-text">
            <strong>{t('rateLimitConfirm.title')}</strong>
            <span className="rate-limit-badge">{info.limit}</span>
          </div>
        </div>

        <div className="rate-limit-message">
          <p>{info.message}</p>
          <p className="rate-limit-usage">
            {t('rateLimitConfirm.iocCount', 'Analyzing {{count}} indicator(s)', { count: iocCount })}
          </p>
          <p className="rate-limit-warning-small">{info.warning}</p>
        </div>

        <div className="rate-limit-actions">
          <button className="rate-limit-confirm-btn" onClick={onConfirm}>
            {t('rateLimitConfirm.confirm', 'Yes, Analyze')}
          </button>
          <p className="rate-limit-skip-hint">
            {t('rateLimitConfirm.skipHint', 'Analysis will skip this provider if not confirmed')}
          </p>
        </div>
      </div>
    </div>
  );
};
