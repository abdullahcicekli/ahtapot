import React from 'react';
import { IOCAnalysisResult } from '@/types/ioc';
import { SGBEntry } from '@/types/siberguvenlik';
import { AlertCircle, CheckCircle, ExternalLink, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import './SGBResultCard.css';

interface SGBResultCardProps {
  result: IOCAnalysisResult;
}

export const SGBResultCard: React.FC<SGBResultCardProps> = ({ result }) => {
  const { t } = useTranslation('results');
  const { details } = result;

  const listed: boolean = Boolean(details?.listed);
  const match: SGBEntry | null = details?.match || null;
  const related: SGBEntry[] = details?.related || [];
  const relatedCount: number = details?.relatedCount || 0;

  const criticality = match?.criticality;
  const levelLabel =
    criticality === undefined
      ? null
      : criticality >= 7
        ? t('sgb.levelCritical')
        : criticality >= 4
          ? t('sgb.levelMedium')
          : t('sgb.levelLow');
  const levelClass =
    criticality === undefined ? '' : criticality >= 7 ? 'critical' : criticality >= 4 ? 'medium' : 'low';

  return (
    <div className="sgb-card">
      <div className={`sgb-verdict ${listed ? 'listed' : 'clean'}`}>
        {listed ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
        <span>{listed ? t('sgb.listed') : t('sgb.notListed')}</span>
        {match?.detailUrl && (
          <a
            href={match.detailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="sgb-detail-link"
          >
            {t('sgb.viewDetails')}
            <ExternalLink size={11} />
          </a>
        )}
      </div>

      {listed && match && (
        <>
          {criticality !== undefined && (
            <div className="sgb-criticality">
              <div className="sgb-criticality-head">
                <span className="sgb-label">{t('sgb.criticality')}</span>
                <span className={`sgb-criticality-value ${levelClass}`}>
                  {criticality} / 10 ({levelLabel})
                </span>
              </div>
              <div className="sgb-criticality-track">
                <div
                  className={`sgb-criticality-fill ${levelClass}`}
                  style={{ width: `${Math.min(criticality * 10, 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="sgb-grid">
            {match.category && (
              <div className="sgb-field">
                <span className="sgb-label">{t('sgb.category')}</span>
                <span className="sgb-value sgb-category">{match.category}</span>
              </div>
            )}
            {match.recordType && (
              <div className="sgb-field">
                <span className="sgb-label">{t('sgb.recordType')}</span>
                <span className="sgb-value sgb-mono">{match.recordType}</span>
              </div>
            )}
            {match.connection && (
              <div className="sgb-field">
                <span className="sgb-label">{t('sgb.connection')}</span>
                <span className="sgb-value">{match.connection}</span>
              </div>
            )}
            {match.source && (
              <div className="sgb-field">
                <span className="sgb-label">{t('sgb.source')}</span>
                <span className="sgb-value">{match.source}</span>
              </div>
            )}
            {match.date && (
              <div className="sgb-field">
                <span className="sgb-label">{t('sgb.dateAdded')}</span>
                <span className="sgb-value sgb-mono">{match.date}</span>
              </div>
            )}
          </div>

          {match.categoryDesc && <p className="sgb-category-desc">{match.categoryDesc}</p>}
        </>
      )}

      {relatedCount > 0 && (
        <details className="sgb-related" open={!listed}>
          <summary>
            <ChevronRight size={12} className="sgb-related-chevron" />
            {t('sgb.related')}
            <span className="sgb-related-count">{relatedCount}</span>
          </summary>
          <div className="sgb-related-list">
            {related.map((entry) => (
              <div key={entry.id ?? entry.value} className="sgb-related-item">
                <div className="sgb-related-row">
                  {entry.detailUrl ? (
                    <a
                      href={entry.detailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sgb-related-value"
                      title={entry.value}
                    >
                      {entry.value}
                    </a>
                  ) : (
                    <span className="sgb-related-value" title={entry.value}>
                      {entry.value}
                    </span>
                  )}
                  {entry.category && <span className="sgb-related-tag">{entry.category}</span>}
                </div>
                <div className="sgb-related-meta">
                  {entry.source}
                  {entry.date ? ` · ${entry.date}` : ''}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};
