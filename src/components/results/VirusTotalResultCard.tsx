import React, { useState } from 'react';
import { IOCAnalysisResult } from '@/types/ioc';
import { getIOCTypeLabel } from '@/utils/ioc-detector';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Globe,
  Server,
  Shield
} from 'lucide-react';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import './VirusTotalResultCard.css';

interface VirusTotalResultCardProps {
  result: IOCAnalysisResult;
}

interface VendorResult {
  engine_name: string;
  category: 'harmless' | 'malicious' | 'suspicious' | 'undetected';
  result: string;
}

export const VirusTotalResultCard: React.FC<VirusTotalResultCardProps> = ({ result }) => {
  const { t } = useTranslation('results');
  const [activeTab, setActiveTab] = useState<'detection' | 'details'>('detection');

  const { details } = result;

  // Community score calculation
  const totalEngines = details?.total || 95;
  const maliciousCount = details?.malicious || 0;
  const suspiciousCount = details?.suspicious || 0;
  const communityScore = maliciousCount + suspiciousCount;

  // Get community score color
  const getScoreColor = () => {
    if (communityScore === 0) return '#22c55e'; // green
    if (communityScore <= 5) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  // Get status icon and color
  const getStatusInfo = () => {
    if (maliciousCount > 0) {
      return {
        icon: <XCircle size={20} />,
        label: t('virustotal.status.malicious'),
        className: 'malicious',
        description: t('virustotal.statusDescription.malicious', { count: communityScore, total: totalEngines })
      };
    }
    if (suspiciousCount > 0) {
      return {
        icon: <AlertTriangle size={20} />,
        label: t('virustotal.status.suspicious'),
        className: 'suspicious',
        description: t('virustotal.statusDescription.suspicious', { count: communityScore, total: totalEngines })
      };
    }
    return {
      icon: <CheckCircle size={20} />,
      label: t('virustotal.status.clean'),
      className: 'clean',
      description: t('virustotal.statusDescription.clean')
    };
  };

  // Get individual vendor results (only non-clean)
  const getNonCleanVendors = (): VendorResult[] => {
    if (!details?.last_analysis_results) return [];

    const results: VendorResult[] = [];
    Object.entries(details.last_analysis_results).forEach(([engine, data]: [string, any]) => {
      if (data.category === 'malicious' || data.category === 'suspicious') {
        results.push({
          engine_name: engine,
          category: data.category,
          result: data.result || data.category
        });
      }
    });

    return results;
  };

  // Pagination for vendor results
  const [vendorPage, setVendorPage] = useState(0);
  const vendorsPerPage = 10;
  const nonCleanVendors = getNonCleanVendors();
  const totalPages = Math.ceil(nonCleanVendors.length / vendorsPerPage);
  const paginatedVendors = nonCleanVendors.slice(
    vendorPage * vendorsPerPage,
    (vendorPage + 1) * vendorsPerPage
  );

  const statusInfo = getStatusInfo();

  // Generate VirusTotal URL based on IOC type
  const getVirusTotalUrl = () => {
    const iocValue = result.ioc.value;
    const iocType = result.ioc.type;

    switch (iocType) {
      case 'ipv4':
      case 'ipv6':
        return `https://www.virustotal.com/gui/ip-address/${iocValue}`;
      case 'domain':
        return `https://www.virustotal.com/gui/domain/${iocValue}`;
      case 'url':
        // URL needs to be base64 encoded for VirusTotal
        const urlIdentifier = btoa(iocValue).replace(/=/g, '');
        return `https://www.virustotal.com/gui/url/${urlIdentifier}`;
      case 'md5':
      case 'sha1':
      case 'sha256':
        return `https://www.virustotal.com/gui/file/${iocValue}`;
      default:
        return `https://www.virustotal.com/gui/search/${encodeURIComponent(iocValue)}`;
    }
  };

  return (
    <div className="vt-result-card">
      {/* Header */}
      <div className="vt-header">
        <div className="vt-header-left">
          <div
            className="vt-score-circle"
            style={{
              '--score-color': getScoreColor(),
              '--score-percent': `${(communityScore / totalEngines) * 100}%`
            } as React.CSSProperties}
          >
            <div className="vt-score-value">{communityScore}</div>
            <div className="vt-score-total">/ {totalEngines}</div>
          </div>
          <div className="vt-score-label">
            {t('virustotal.communityScore')}
            <span className="vt-score-votes">
              {details?.total_votes ?
                `${details.total_votes.harmless || 0} 👍 ${details.total_votes.malicious || 0} 👎`
                : ''}
            </span>
          </div>
        </div>

        <div className="vt-header-right">
          <div className="vt-ioc-info">
            <div className="vt-ioc-value">{result.ioc.value}</div>
            <div className="vt-ioc-meta">
              {details?.asn && <span>AS {details.asn}</span>}
              {details?.as_owner && <span>({details.as_owner})</span>}
            </div>
          </div>
        </div>

        <div className="vt-header-actions">
          <div className={`vt-status-badge ${statusInfo.className}`}>
            {statusInfo.icon}
            <span>{statusInfo.label}</span>
          </div>
          {details?.last_analysis_date && (
            <div className="vt-analysis-date">
              <Info size={14} />
              {new Date(details.last_analysis_date).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </div>
          )}
        </div>
      </div>

      {/* Status Description */}
      <div className={`vt-status-description ${statusInfo.className}`}>
        <AlertCircle size={16} />
        {statusInfo.description}
      </div>

      {/* Unsupported IOC Type */}
      {result.unsupportedReason && result.supportedTypes && (
        <div className="vt-unsupported">
          <div className="vt-unsupported-message">
            <AlertTriangle size={16} />
            <span>{result.unsupportedReason}</span>
          </div>
          <div className="vt-supported-types">
            <span className="vt-supported-label">{t('virustotal.unsupportedType')}</span>
            <div className="vt-supported-badges">
              {result.supportedTypes.map((type, idx) => (
                <span key={idx} className="vt-ioc-badge">
                  {getIOCTypeLabel(type)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="vt-tabs">
        <button
          className={`vt-tab ${activeTab === 'detection' ? 'active' : ''}`}
          onClick={() => setActiveTab('detection')}
        >
          <Shield size={16} />
          {t('virustotal.tabs.detection')}
          {nonCleanVendors.length > 0 && (
            <span className="vt-tab-badge">{nonCleanVendors.length}</span>
          )}
        </button>
        <button
          className={`vt-tab ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          <Info size={16} />
          {t('virustotal.tabs.details')}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'detection' && (
        <div className="vt-tab-content">
          {nonCleanVendors.length > 0 ? (
            <>
              <div className="vt-vendors-grid">
                {paginatedVendors.map((vendor, index) => (
                  <div key={index} className={`vt-vendor-item ${vendor.category}`}>
                    <div className="vt-vendor-name">{vendor.engine_name}</div>
                    <div className="vt-vendor-result">
                      {vendor.category === 'malicious' ? (
                        <XCircle size={14} />
                      ) : (
                        <AlertTriangle size={14} />
                      )}
                      <span className="vt-vendor-category">
                        {vendor.category === 'malicious' ? t('virustotal.detection.vendorCategory.malicious') : t('virustotal.detection.vendorCategory.suspicious')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="vt-pagination">
                  <button
                    className="vt-page-btn"
                    onClick={() => setVendorPage(Math.max(0, vendorPage - 1))}
                    disabled={vendorPage === 0}
                  >
                    {t('virustotal.pagination.previous')}
                  </button>
                  <span className="vt-page-info">
                    {t('virustotal.pagination.page', { current: vendorPage + 1, total: totalPages })}
                  </span>
                  <button
                    className="vt-page-btn"
                    onClick={() => setVendorPage(Math.min(totalPages - 1, vendorPage + 1))}
                    disabled={vendorPage === totalPages - 1}
                  >
                    {t('virustotal.pagination.next')}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="vt-no-detections">
              <CheckCircle size={32} />
              <p>{t('virustotal.detection.noDetections')}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'details' && (
        <div className="vt-tab-content">
          <div className="vt-details-grid">
            {/* Location Info */}
            {(details?.country || details?.continent) && (
              <div className="vt-detail-section">
                <div className="vt-detail-header">
                  <Globe size={16} />
                  {t('virustotal.details.location')}
                </div>
                <div className="vt-detail-items">
                  {details?.country && (
                    <div className="vt-detail-item">
                      <span className="vt-detail-label">{t('virustotal.details.country')}</span>
                      <span className="vt-detail-value">{details.country}</span>
                    </div>
                  )}
                  {details?.continent && (
                    <div className="vt-detail-item">
                      <span className="vt-detail-label">{t('virustotal.details.continent')}</span>
                      <span className="vt-detail-value">{details.continent}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Network Info */}
            {(details?.network || details?.asn) && (
              <div className="vt-detail-section">
                <div className="vt-detail-header">
                  <Server size={16} />
                  {t('virustotal.details.network')}
                </div>
                <div className="vt-detail-items">
                  {details?.network && (
                    <div className="vt-detail-item">
                      <span className="vt-detail-label">{t('virustotal.details.networkRange')}</span>
                      <span className="vt-detail-value">{details.network}</span>
                    </div>
                  )}
                  {details?.asn && (
                    <div className="vt-detail-item">
                      <span className="vt-detail-label">{t('virustotal.details.asn')}</span>
                      <span className="vt-detail-value">AS{details.asn}</span>
                    </div>
                  )}
                  {details?.as_owner && (
                    <div className="vt-detail-item">
                      <span className="vt-detail-label">{t('virustotal.details.owner')}</span>
                      <span className="vt-detail-value">{details.as_owner}</span>
                    </div>
                  )}
                  {details?.regional_internet_registry && (
                    <div className="vt-detail-item">
                      <span className="vt-detail-label">{t('virustotal.details.rir')}</span>
                      <span className="vt-detail-value">{details.regional_internet_registry}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reputation */}
            {details?.reputation !== undefined && (
              <div className="vt-detail-section">
                <div className="vt-detail-header">
                  <Shield size={16} />
                  {t('virustotal.details.reputation')}
                </div>
                <div className="vt-detail-items">
                  <div className="vt-detail-item">
                    <span className="vt-detail-label">{t('virustotal.details.score')}</span>
                    <span className={`vt-detail-value ${details.reputation < 0 ? 'negative' : 'positive'}`}>
                      {details.reputation}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tags */}
            {details?.tags && details.tags.length > 0 && (
              <div className="vt-detail-section full-width">
                <div className="vt-detail-header">
                  <Info size={16} />
                  {t('virustotal.details.tags')}
                </div>
                <div className="vt-tags">
                  {details.tags.map((tag: string, index: number) => (
                    <span key={index} className="vt-tag">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* View on VirusTotal Link */}
          <div className="vt-external-link">
            <a
              href={getVirusTotalUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="vt-link-button"
            >
              {t('virustotal.viewFullReport')}
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
