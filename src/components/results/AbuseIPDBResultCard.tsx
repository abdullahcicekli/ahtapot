import React, { useState } from 'react';
import { IOCAnalysisResult } from '@/types/ioc';
import { getIOCTypeLabel } from '@/utils/ioc-detector';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Shield,
  MapPin,
  Globe,
  Clock,
  Flag,
  Tag,
} from 'lucide-react';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import './AbuseIPDBResultCard.css';

interface AbuseIPDBResultCardProps {
  result: IOCAnalysisResult;
}

interface Report {
  reportedAt: string;
  comment: string;
  categories: number[];
  categoryLabels: string[];
  reporterCountryCode: string;
  reporterCountryName: string;
}

export const AbuseIPDBResultCard: React.FC<AbuseIPDBResultCardProps> = ({ result }) => {
  const { t } = useTranslation('results');
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'details'>('overview');

  const { details } = result;

  const abuseScore = details?.abuseConfidenceScore || 0;
  const totalReports = details?.totalReports || 0;
  const numDistinctUsers = details?.numDistinctUsers || 0;
  const isWhitelisted = details?.isWhitelisted || false;
  const isTor = details?.isTor || false;

  // Get score color based on abuse confidence
  const getScoreColor = () => {
    if (isWhitelisted) return '#22c55e'; // green
    if (abuseScore >= 76) return '#ef4444'; // red
    if (abuseScore >= 26) return '#eab308'; // yellow
    return '#22c55e'; // green
  };

  // Get status info
  const getStatusInfo = () => {
    if (isWhitelisted) {
      return {
        icon: <Shield size={20} />,
        label: t('abuseipdb.status.whitelisted'),
        className: 'whitelisted',
        description: t('abuseipdb.statusDescription.whitelisted')
      };
    }
    if (abuseScore >= 76) {
      return {
        icon: <XCircle size={20} />,
        label: t('abuseipdb.status.malicious'),
        className: 'malicious',
        description: t('abuseipdb.statusDescription.malicious', { score: abuseScore })
      };
    }
    if (abuseScore >= 26) {
      return {
        icon: <AlertTriangle size={20} />,
        label: t('abuseipdb.status.suspicious'),
        className: 'suspicious',
        description: t('abuseipdb.statusDescription.suspicious', { score: abuseScore })
      };
    }
    return {
      icon: <CheckCircle size={20} />,
      label: t('abuseipdb.status.clean'),
      className: 'clean',
      description: t('abuseipdb.statusDescription.clean', { score: abuseScore })
    };
  };

  // Pagination for reports
  const [reportPage, setReportPage] = useState(0);
  const reportsPerPage = 3;
  const reports: Report[] = details?.reports || [];
  const totalPages = Math.ceil(reports.length / reportsPerPage);
  const paginatedReports = reports.slice(
    reportPage * reportsPerPage,
    (reportPage + 1) * reportsPerPage
  );

  const statusInfo = getStatusInfo();

  return (
    <div className="abuseipdb-result-card">
      {/* Header */}
      <div className="abuseipdb-header">
        <div className="abuseipdb-header-left">
          <div
            className="abuseipdb-score-circle"
            style={{
              '--score-color': getScoreColor(),
              '--score-percent': `${abuseScore}%`
            } as React.CSSProperties}
          >
            <div className="abuseipdb-score-value">{abuseScore}</div>
            <div className="abuseipdb-score-label-small">{t('abuseipdb.score')}</div>
          </div>
          <div className="abuseipdb-score-info">
            <div className="abuseipdb-score-title">{t('abuseipdb.abuseConfidence')}</div>
            <div className="abuseipdb-score-breakdown">
              <span className="abuseipdb-reports">{t('abuseipdb.reports', { count: totalReports })}</span>
              <span className="abuseipdb-users">{t('abuseipdb.users', { count: numDistinctUsers })}</span>
            </div>
          </div>
        </div>

        <div className="abuseipdb-header-right">
          <div className="abuseipdb-ioc-info">
            <div className="abuseipdb-ioc-value">{result.ioc.value}</div>
            <div className="abuseipdb-ioc-type">{result.ioc.type.toUpperCase()}</div>
          </div>
        </div>

        <div className="abuseipdb-header-actions">
          <div className={`abuseipdb-status-badge ${statusInfo.className}`}>
            {statusInfo.icon}
            <span>{statusInfo.label}</span>
          </div>
        </div>
      </div>

      {/* Status Description */}
      <div className={`abuseipdb-status-description ${statusInfo.className}`}>
        <AlertCircle size={16} />
        {statusInfo.description}
      </div>

      {/* Unsupported IOC Type */}
      {result.unsupportedReason && result.supportedTypes && (
        <div className="abuseipdb-unsupported">
          <div className="abuseipdb-unsupported-message">
            <AlertTriangle size={16} />
            <span>{result.unsupportedReason}</span>
          </div>
          <div className="abuseipdb-supported-types">
            <span className="abuseipdb-supported-label">{t('abuseipdb.unsupportedType')}</span>
            <div className="abuseipdb-supported-badges">
              {result.supportedTypes.map((type, idx) => (
                <span key={idx} className="abuseipdb-ioc-badge">
                  {getIOCTypeLabel(type)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Special Badges */}
      {(isTor || isWhitelisted) && (
        <div className="abuseipdb-badges">
          {isTor && (
            <div className="abuseipdb-badge tor">
              <Shield size={14} />
              {t('abuseipdb.badges.torExitNode')}
            </div>
          )}
          {isWhitelisted && (
            <div className="abuseipdb-badge whitelisted">
              <CheckCircle size={14} />
              {t('abuseipdb.badges.whitelisted')}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="abuseipdb-tabs">
        <button
          className={`abuseipdb-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Info size={16} />
          {t('abuseipdb.tabs.overview')}
        </button>
        <button
          className={`abuseipdb-tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <Flag size={16} />
          {t('abuseipdb.tabs.reports')}
          {reports.length > 0 && (
            <span className="abuseipdb-tab-badge">{reports.length}</span>
          )}
        </button>
        <button
          className={`abuseipdb-tab ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          <Globe size={16} />
          {t('abuseipdb.tabs.details')}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="abuseipdb-tab-content">
          <div className="abuseipdb-overview-grid">
            {/* Abuse Metrics */}
            <div className="abuseipdb-metric-card">
              <div className="abuseipdb-metric-header">
                <AlertCircle size={18} />
                <span>{t('abuseipdb.overview.abuseMetrics')}</span>
              </div>
              <div className="abuseipdb-metric-body">
                <div className="abuseipdb-metric-item">
                  <span className="abuseipdb-metric-label">{t('abuseipdb.overview.confidenceScore')}</span>
                  <span className={`abuseipdb-metric-value score-${statusInfo.className}`}>
                    {abuseScore}%
                  </span>
                </div>
                <div className="abuseipdb-metric-item">
                  <span className="abuseipdb-metric-label">{t('abuseipdb.overview.totalReports')}</span>
                  <span className="abuseipdb-metric-value">{totalReports}</span>
                </div>
                <div className="abuseipdb-metric-item">
                  <span className="abuseipdb-metric-label">{t('abuseipdb.overview.uniqueReporters')}</span>
                  <span className="abuseipdb-metric-value">{numDistinctUsers}</span>
                </div>
                {details?.lastReportedAt && (
                  <div className="abuseipdb-metric-item">
                    <span className="abuseipdb-metric-label">{t('abuseipdb.overview.lastReported')}</span>
                    <span className="abuseipdb-metric-value">
                      {new Date(details.lastReportedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Abuse Categories */}
            {details?.categoryLabels && details.categoryLabels.length > 0 && (
              <div className="abuseipdb-metric-card full-width">
                <div className="abuseipdb-metric-header">
                  <Tag size={18} />
                  <span>{t('abuseipdb.overview.abuseCategories')}</span>
                </div>
                <div className="abuseipdb-categories">
                  {details.categoryLabels.map((category: string, index: number) => (
                    <span key={index} className="abuseipdb-category">
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Geographic Info */}
            <div className="abuseipdb-metric-card">
              <div className="abuseipdb-metric-header">
                <MapPin size={18} />
                <span>{t('abuseipdb.overview.locationNetwork')}</span>
              </div>
              <div className="abuseipdb-metric-body">
                {details?.countryName && (
                  <div className="abuseipdb-metric-item">
                    <span className="abuseipdb-metric-label">{t('abuseipdb.overview.country')}</span>
                    <span className="abuseipdb-metric-value">
                      {details.countryName} ({details.countryCode})
                    </span>
                  </div>
                )}
                {details?.isp && (
                  <div className="abuseipdb-metric-item">
                    <span className="abuseipdb-metric-label">{t('abuseipdb.overview.isp')}</span>
                    <span className="abuseipdb-metric-value">{details.isp}</span>
                  </div>
                )}
                {details?.domain && (
                  <div className="abuseipdb-metric-item">
                    <span className="abuseipdb-metric-label">{t('abuseipdb.overview.domain')}</span>
                    <span className="abuseipdb-metric-value">{details.domain}</span>
                  </div>
                )}
                {details?.usageType && (
                  <div className="abuseipdb-metric-item">
                    <span className="abuseipdb-metric-label">{t('abuseipdb.overview.usageType')}</span>
                    <span className="abuseipdb-metric-value">{details.usageType}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="abuseipdb-tab-content">
          {reports.length > 0 ? (
            <>
              <div className="abuseipdb-reports-list">
                {paginatedReports.map((report, index) => (
                  <div key={index} className="abuseipdb-report-item">
                    <div className="abuseipdb-report-header">
                      <div className="abuseipdb-report-date">
                        <Clock size={14} />
                        {new Date(report.reportedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="abuseipdb-report-country">
                        <MapPin size={14} />
                        {report.reporterCountryName}
                      </div>
                    </div>

                    {report.comment && (
                      <div className="abuseipdb-report-comment">
                        {report.comment}
                      </div>
                    )}

                    {report.categoryLabels && report.categoryLabels.length > 0 && (
                      <div className="abuseipdb-report-categories">
                        {report.categoryLabels.map((category, idx) => (
                          <span key={idx} className="abuseipdb-report-category">
                            <Tag size={12} />
                            {category}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="abuseipdb-pagination">
                  <button
                    className="abuseipdb-page-btn"
                    onClick={() => setReportPage(Math.max(0, reportPage - 1))}
                    disabled={reportPage === 0}
                  >
                    Previous
                  </button>
                  <span className="abuseipdb-page-info">
                    Page {reportPage + 1} of {totalPages}
                  </span>
                  <button
                    className="abuseipdb-page-btn"
                    onClick={() => setReportPage(Math.min(totalPages - 1, reportPage + 1))}
                    disabled={reportPage === totalPages - 1}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="abuseipdb-no-reports">
              <CheckCircle size={32} />
              <p>{t('abuseipdb.reportsTab.noReports')}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'details' && (
        <div className="abuseipdb-tab-content">
          <div className="abuseipdb-details-grid">
            {/* IP Information */}
            <div className="abuseipdb-detail-section">
              <div className="abuseipdb-detail-header">
                <Globe size={16} />
                {t('abuseipdb.details.ipInformation')}
              </div>
              <div className="abuseipdb-detail-items">
                <div className="abuseipdb-detail-item">
                  <span className="abuseipdb-detail-label">{t('abuseipdb.details.ipAddress')}</span>
                  <span className="abuseipdb-detail-value">{details?.ipAddress}</span>
                </div>
                <div className="abuseipdb-detail-item">
                  <span className="abuseipdb-detail-label">{t('abuseipdb.details.ipVersion')}</span>
                  <span className="abuseipdb-detail-value">IPv{details?.ipVersion}</span>
                </div>
                <div className="abuseipdb-detail-item">
                  <span className="abuseipdb-detail-label">{t('abuseipdb.details.publicIp')}</span>
                  <span className="abuseipdb-detail-value">
                    {details?.isPublic ? t('abuseipdb.details.yes') : t('abuseipdb.details.no')}
                  </span>
                </div>
                <div className="abuseipdb-detail-item">
                  <span className="abuseipdb-detail-label">{t('abuseipdb.details.whitelisted')}</span>
                  <span className={`abuseipdb-detail-value ${isWhitelisted ? 'positive' : ''}`}>
                    {isWhitelisted ? t('abuseipdb.details.yes') : t('abuseipdb.details.no')}
                  </span>
                </div>
                <div className="abuseipdb-detail-item">
                  <span className="abuseipdb-detail-label">{t('abuseipdb.details.torExitNode')}</span>
                  <span className={`abuseipdb-detail-value ${isTor ? 'warning' : ''}`}>
                    {isTor ? t('abuseipdb.details.yes') : t('abuseipdb.details.no')}
                  </span>
                </div>
              </div>
            </div>

            {/* Hostnames */}
            {details?.hostnames && details.hostnames.length > 0 && (
              <div className="abuseipdb-detail-section full-width">
                <div className="abuseipdb-detail-header">
                  <Globe size={16} />
                  {t('abuseipdb.details.hostnames')}
                </div>
                <div className="abuseipdb-hostnames">
                  {details.hostnames.map((hostname: string, index: number) => (
                    <span key={index} className="abuseipdb-hostname">
                      {hostname}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* View on AbuseIPDB Link */}
          <div className="abuseipdb-external-link">
            <a
              href={`https://www.abuseipdb.com/check/${details?.ipAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="abuseipdb-link-button"
            >
              {t('abuseipdb.viewFullReport')}
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
