import React, { useState } from 'react';
import { IOCAnalysisResult } from '@/types/ioc';
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
        label: 'Malicious',
        className: 'malicious',
        description: `${communityScore}/${totalEngines} security vendors flagged this as malicious`
      };
    }
    if (suspiciousCount > 0) {
      return {
        icon: <AlertTriangle size={20} />,
        label: 'Suspicious',
        className: 'suspicious',
        description: `${communityScore}/${totalEngines} security vendors flagged this as suspicious`
      };
    }
    return {
      icon: <CheckCircle size={20} />,
      label: 'Clean',
      className: 'clean',
      description: 'No security vendors flagged this as malicious'
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
            Community Score
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

      {/* Tabs */}
      <div className="vt-tabs">
        <button
          className={`vt-tab ${activeTab === 'detection' ? 'active' : ''}`}
          onClick={() => setActiveTab('detection')}
        >
          <Shield size={16} />
          Detection
          {nonCleanVendors.length > 0 && (
            <span className="vt-tab-badge">{nonCleanVendors.length}</span>
          )}
        </button>
        <button
          className={`vt-tab ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          <Info size={16} />
          Details
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
                        {vendor.category === 'malicious' ? 'Malicious' : 'Suspicious'}
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
                    Previous
                  </button>
                  <span className="vt-page-info">
                    Page {vendorPage + 1} of {totalPages}
                  </span>
                  <button
                    className="vt-page-btn"
                    onClick={() => setVendorPage(Math.min(totalPages - 1, vendorPage + 1))}
                    disabled={vendorPage === totalPages - 1}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="vt-no-detections">
              <CheckCircle size={32} />
              <p>No security vendors flagged this as malicious</p>
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
                  Location
                </div>
                <div className="vt-detail-items">
                  {details?.country && (
                    <div className="vt-detail-item">
                      <span className="vt-detail-label">Country:</span>
                      <span className="vt-detail-value">{details.country}</span>
                    </div>
                  )}
                  {details?.continent && (
                    <div className="vt-detail-item">
                      <span className="vt-detail-label">Continent:</span>
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
                  Network
                </div>
                <div className="vt-detail-items">
                  {details?.network && (
                    <div className="vt-detail-item">
                      <span className="vt-detail-label">Network:</span>
                      <span className="vt-detail-value">{details.network}</span>
                    </div>
                  )}
                  {details?.asn && (
                    <div className="vt-detail-item">
                      <span className="vt-detail-label">ASN:</span>
                      <span className="vt-detail-value">AS{details.asn}</span>
                    </div>
                  )}
                  {details?.as_owner && (
                    <div className="vt-detail-item">
                      <span className="vt-detail-label">Owner:</span>
                      <span className="vt-detail-value">{details.as_owner}</span>
                    </div>
                  )}
                  {details?.regional_internet_registry && (
                    <div className="vt-detail-item">
                      <span className="vt-detail-label">RIR:</span>
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
                  Reputation
                </div>
                <div className="vt-detail-items">
                  <div className="vt-detail-item">
                    <span className="vt-detail-label">Score:</span>
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
                  Tags
                </div>
                <div className="vt-tags">
                  {details.tags.map((tag: string, index: number) => (
                    <span key={index} className="vt-tag">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
