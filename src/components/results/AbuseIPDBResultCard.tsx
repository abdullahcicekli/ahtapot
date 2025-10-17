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
        label: 'Whitelisted',
        className: 'whitelisted',
        description: 'This IP is on the AbuseIPDB whitelist and considered safe'
      };
    }
    if (abuseScore >= 76) {
      return {
        icon: <XCircle size={20} />,
        label: 'Malicious',
        className: 'malicious',
        description: `High abuse confidence score (${abuseScore}%). This IP has significant abuse reports.`
      };
    }
    if (abuseScore >= 26) {
      return {
        icon: <AlertTriangle size={20} />,
        label: 'Suspicious',
        className: 'suspicious',
        description: `Moderate abuse confidence score (${abuseScore}%). Exercise caution with this IP.`
      };
    }
    return {
      icon: <CheckCircle size={20} />,
      label: 'Clean',
      className: 'clean',
      description: `Low abuse confidence score (${abuseScore}%). No significant abuse reports found.`
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
            <div className="abuseipdb-score-label-small">Score</div>
          </div>
          <div className="abuseipdb-score-info">
            <div className="abuseipdb-score-title">Abuse Confidence</div>
            <div className="abuseipdb-score-breakdown">
              <span className="abuseipdb-reports">{totalReports} Reports</span>
              <span className="abuseipdb-users">{numDistinctUsers} Users</span>
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
            <span className="abuseipdb-supported-label">Supported IOC types:</span>
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
              Tor Exit Node
            </div>
          )}
          {isWhitelisted && (
            <div className="abuseipdb-badge whitelisted">
              <CheckCircle size={14} />
              Whitelisted
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
          Overview
        </button>
        <button
          className={`abuseipdb-tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <Flag size={16} />
          Reports
          {reports.length > 0 && (
            <span className="abuseipdb-tab-badge">{reports.length}</span>
          )}
        </button>
        <button
          className={`abuseipdb-tab ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          <Globe size={16} />
          Details
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
                <span>Abuse Metrics</span>
              </div>
              <div className="abuseipdb-metric-body">
                <div className="abuseipdb-metric-item">
                  <span className="abuseipdb-metric-label">Confidence Score:</span>
                  <span className={`abuseipdb-metric-value score-${statusInfo.className}`}>
                    {abuseScore}%
                  </span>
                </div>
                <div className="abuseipdb-metric-item">
                  <span className="abuseipdb-metric-label">Total Reports:</span>
                  <span className="abuseipdb-metric-value">{totalReports}</span>
                </div>
                <div className="abuseipdb-metric-item">
                  <span className="abuseipdb-metric-label">Unique Reporters:</span>
                  <span className="abuseipdb-metric-value">{numDistinctUsers}</span>
                </div>
                {details?.lastReportedAt && (
                  <div className="abuseipdb-metric-item">
                    <span className="abuseipdb-metric-label">Last Reported:</span>
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

            {/* Geographic Info */}
            <div className="abuseipdb-metric-card">
              <div className="abuseipdb-metric-header">
                <MapPin size={18} />
                <span>Location & Network</span>
              </div>
              <div className="abuseipdb-metric-body">
                {details?.countryName && (
                  <div className="abuseipdb-metric-item">
                    <span className="abuseipdb-metric-label">Country:</span>
                    <span className="abuseipdb-metric-value">
                      {details.countryName} ({details.countryCode})
                    </span>
                  </div>
                )}
                {details?.isp && (
                  <div className="abuseipdb-metric-item">
                    <span className="abuseipdb-metric-label">ISP:</span>
                    <span className="abuseipdb-metric-value">{details.isp}</span>
                  </div>
                )}
                {details?.domain && (
                  <div className="abuseipdb-metric-item">
                    <span className="abuseipdb-metric-label">Domain:</span>
                    <span className="abuseipdb-metric-value">{details.domain}</span>
                  </div>
                )}
                {details?.usageType && (
                  <div className="abuseipdb-metric-item">
                    <span className="abuseipdb-metric-label">Usage Type:</span>
                    <span className="abuseipdb-metric-value">{details.usageType}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Abuse Categories */}
            {details?.categoryLabels && details.categoryLabels.length > 0 && (
              <div className="abuseipdb-metric-card full-width">
                <div className="abuseipdb-metric-header">
                  <Tag size={18} />
                  <span>Abuse Categories</span>
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
              <p>No abuse reports found for this IP address</p>
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
                IP Information
              </div>
              <div className="abuseipdb-detail-items">
                <div className="abuseipdb-detail-item">
                  <span className="abuseipdb-detail-label">IP Address:</span>
                  <span className="abuseipdb-detail-value">{details?.ipAddress}</span>
                </div>
                <div className="abuseipdb-detail-item">
                  <span className="abuseipdb-detail-label">IP Version:</span>
                  <span className="abuseipdb-detail-value">IPv{details?.ipVersion}</span>
                </div>
                <div className="abuseipdb-detail-item">
                  <span className="abuseipdb-detail-label">Public IP:</span>
                  <span className="abuseipdb-detail-value">
                    {details?.isPublic ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="abuseipdb-detail-item">
                  <span className="abuseipdb-detail-label">Whitelisted:</span>
                  <span className={`abuseipdb-detail-value ${isWhitelisted ? 'positive' : ''}`}>
                    {isWhitelisted ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="abuseipdb-detail-item">
                  <span className="abuseipdb-detail-label">Tor Exit Node:</span>
                  <span className={`abuseipdb-detail-value ${isTor ? 'warning' : ''}`}>
                    {isTor ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Hostnames */}
            {details?.hostnames && details.hostnames.length > 0 && (
              <div className="abuseipdb-detail-section full-width">
                <div className="abuseipdb-detail-header">
                  <Globe size={16} />
                  Hostnames
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
              View Full Report on AbuseIPDB →
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
