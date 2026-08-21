import React from 'react';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import './ProviderSkeletonCard.css';

/**
 * Sonucu beklenen provider için shimmer iskelet kartı.
 * Sonuçlar streaming geldiğinden, henüz cevaplamamış provider'lar
 * bu kartla "yolda" olduklarını gösterir.
 */
export const ProviderSkeletonCard: React.FC<{ provider: string }> = ({ provider }) => {
  const { t } = useTranslation('sidepanel');

  return (
    <div
      className="provider-skeleton-card"
      role="status"
      aria-label={`${provider} — ${t('loading.analyzing')}`}
    >
      <div className="provider-skeleton-header">
        <span className="provider-skeleton-name">{provider}</span>
        <span className="provider-skeleton-status">
          <span className="skeleton-pulse-dot" />
          {t('loading.analyzing')}
        </span>
      </div>
      <div className="skeleton-line" style={{ width: '52%' }} />
      <div className="skeleton-line" style={{ width: '86%' }} />
      <div className="skeleton-line" style={{ width: '68%' }} />
      <div className="provider-skeleton-grid">
        <div className="skeleton-line" />
        <div className="skeleton-line" />
        <div className="skeleton-line" />
        <div className="skeleton-line" />
      </div>
    </div>
  );
};
