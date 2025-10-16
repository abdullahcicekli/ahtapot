import React, { useState } from 'react';
import { IOCAnalysisResult } from '@/types/ioc';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Activity,
  Target,
  Users,
  Tag
} from 'lucide-react';
import './OTXResultCard.css';

interface OTXResultCardProps {
  result: IOCAnalysisResult;
}

interface Pulse {
  id: string;
  name: string;
  description: string;
  author: string;
  created: string;
  tags: string[];
  malware_families?: string[];
  targeted_countries?: string[];
}

export const OTXResultCard: React.FC<OTXResultCardProps> = ({ result }) => {
  const [activeTab, setActiveTab] = useState<'pulses' | 'details'>('pulses');

  const { details } = result;

  const pulseCount = details?.pulseCount || 0;
  const maliciousCount = details?.malicious || 0;
  const suspiciousCount = details?.suspicious || 0;
  const threatScore = maliciousCount + suspiciousCount;

  // Get threat score color
  const getScoreColor = () => {
    if (threatScore === 0) return '#22c55e'; // green
    if (threatScore <= 3) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  // Get status info
  const getStatusInfo = () => {
    if (maliciousCount > 0) {
      return {
        icon: <XCircle size={20} />,
        label: 'Malicious',
        className: 'malicious',
        description: `Found in ${maliciousCount} malicious threat intelligence pulse(s)`
      };
    }
    if (suspiciousCount > 0) {
      return {
        icon: <AlertTriangle size={20} />,
        label: 'Suspicious',
        className: 'suspicious',
        description: `Found in ${suspiciousCount} suspicious threat intelligence pulse(s)`
      };
    }
    return {
      icon: <CheckCircle size={20} />,
      label: 'Clean',
      className: 'clean',
      description: 'No threat intelligence data found for this indicator'
    };
  };

  // Pagination for pulses
  const [pulsePage, setPulsePage] = useState(0);
  const pulsesPerPage = 5;
  const pulses: Pulse[] = details?.pulses || [];
  const totalPages = Math.ceil(pulses.length / pulsesPerPage);
  const paginatedPulses = pulses.slice(
    pulsePage * pulsesPerPage,
    (pulsePage + 1) * pulsesPerPage
  );

  const statusInfo = getStatusInfo();

  return (
    <div className="otx-result-card">
      {/* Header */}
      <div className="otx-header">
        <div className="otx-header-left">
          <div
            className="otx-score-circle"
            style={{
              '--score-color': getScoreColor(),
              '--score-percent': `${pulseCount > 0 ? ((threatScore / pulseCount) * 100) : 0}%`
            } as React.CSSProperties}
          >
            <div className="otx-score-value">{pulseCount}</div>
            <div className="otx-score-label-small">Pulses</div>
          </div>
          <div className="otx-score-info">
            <div className="otx-score-title">Threat Intelligence</div>
            <div className="otx-score-breakdown">
              <span className="otx-malicious">{maliciousCount} Malicious</span>
              <span className="otx-suspicious">{suspiciousCount} Suspicious</span>
            </div>
          </div>
        </div>

        <div className="otx-header-right">
          <div className="otx-ioc-info">
            <div className="otx-ioc-value">{result.ioc.value}</div>
            <div className="otx-ioc-type">{result.ioc.type.toUpperCase()}</div>
          </div>
        </div>

        <div className="otx-header-actions">
          <div className={`otx-status-badge ${statusInfo.className}`}>
            {statusInfo.icon}
            <span>{statusInfo.label}</span>
          </div>
        </div>
      </div>

      {/* Status Description */}
      <div className={`otx-status-description ${statusInfo.className}`}>
        <AlertCircle size={16} />
        {statusInfo.description}
      </div>

      {/* Tabs */}
      <div className="otx-tabs">
        <button
          className={`otx-tab ${activeTab === 'pulses' ? 'active' : ''}`}
          onClick={() => setActiveTab('pulses')}
        >
          <Activity size={16} />
          Pulses
          {pulses.length > 0 && (
            <span className="otx-tab-badge">{pulses.length}</span>
          )}
        </button>
        <button
          className={`otx-tab ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          <Info size={16} />
          Details
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'pulses' && (
        <div className="otx-tab-content">
          {pulses.length > 0 ? (
            <>
              <div className="otx-pulses-list">
                {paginatedPulses.map((pulse, index) => (
                  <div key={index} className="otx-pulse-item">
                    <div className="otx-pulse-header">
                      <div className="otx-pulse-title">
                        <Target size={16} />
                        {pulse.name}
                      </div>
                      <div className="otx-pulse-author">
                        <Users size={14} />
                        {pulse.author}
                      </div>
                    </div>

                    {pulse.description && (
                      <div className="otx-pulse-description">
                        {pulse.description}
                      </div>
                    )}

                    {pulse.tags && pulse.tags.length > 0 && (
                      <div className="otx-pulse-tags">
                        {pulse.tags.slice(0, 5).map((tag, idx) => (
                          <span key={idx} className="otx-pulse-tag">
                            <Tag size={12} />
                            {tag}
                          </span>
                        ))}
                        {pulse.tags.length > 5 && (
                          <span className="otx-pulse-tag-more">
                            +{pulse.tags.length - 5} more
                          </span>
                        )}
                      </div>
                    )}

                    {pulse.malware_families && pulse.malware_families.length > 0 && (
                      <div className="otx-pulse-malware">
                        <AlertTriangle size={14} />
                        <strong>Malware Families:</strong>
                        <span>{pulse.malware_families.join(', ')}</span>
                      </div>
                    )}

                    {pulse.targeted_countries && pulse.targeted_countries.length > 0 && (
                      <div className="otx-pulse-countries">
                        <Target size={14} />
                        <strong>Targeted Countries:</strong>
                        <span>{pulse.targeted_countries.join(', ')}</span>
                      </div>
                    )}

                    <div className="otx-pulse-footer">
                      <span className="otx-pulse-date">
                        {new Date(pulse.created).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      <a
                        href={`https://otx.alienvault.com/pulse/${pulse.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="otx-pulse-link"
                      >
                        View on OTX →
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="otx-pagination">
                  <button
                    className="otx-page-btn"
                    onClick={() => setPulsePage(Math.max(0, pulsePage - 1))}
                    disabled={pulsePage === 0}
                  >
                    Previous
                  </button>
                  <span className="otx-page-info">
                    Page {pulsePage + 1} of {totalPages}
                  </span>
                  <button
                    className="otx-page-btn"
                    onClick={() => setPulsePage(Math.min(totalPages - 1, pulsePage + 1))}
                    disabled={pulsePage === totalPages - 1}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="otx-no-pulses">
              <CheckCircle size={32} />
              <p>No threat intelligence pulses found for this indicator</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'details' && (
        <div className="otx-tab-content">
          <div className="otx-details-grid">
            {/* Statistics */}
            <div className="otx-detail-section">
              <div className="otx-detail-header">
                <Activity size={16} />
                Statistics
              </div>
              <div className="otx-detail-items">
                <div className="otx-detail-item">
                  <span className="otx-detail-label">Total Pulses:</span>
                  <span className="otx-detail-value">{pulseCount}</span>
                </div>
                <div className="otx-detail-item">
                  <span className="otx-detail-label">Malicious:</span>
                  <span className="otx-detail-value malicious">{maliciousCount}</span>
                </div>
                <div className="otx-detail-item">
                  <span className="otx-detail-label">Suspicious:</span>
                  <span className="otx-detail-value suspicious">{suspiciousCount}</span>
                </div>
                <div className="otx-detail-item">
                  <span className="otx-detail-label">Harmless:</span>
                  <span className="otx-detail-value">{details?.harmless || 0}</span>
                </div>
              </div>
            </div>

            {/* Reputation */}
            {details?.reputation !== undefined && (
              <div className="otx-detail-section">
                <div className="otx-detail-header">
                  <Info size={16} />
                  Reputation
                </div>
                <div className="otx-detail-items">
                  <div className="otx-detail-item">
                    <span className="otx-detail-label">Score:</span>
                    <span className={`otx-detail-value ${details.reputation < 0 ? 'negative' : 'positive'}`}>
                      {details.reputation}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Related Adversaries */}
            {details?.related?.alienvault?.adversary && details.related.alienvault.adversary.length > 0 && (
              <div className="otx-detail-section full-width">
                <div className="otx-detail-header">
                  <Target size={16} />
                  Related Adversaries
                </div>
                <div className="otx-tags">
                  {details.related.alienvault.adversary.map((adversary: string, index: number) => (
                    <span key={index} className="otx-tag adversary">{adversary}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Malware Families */}
            {details?.related?.alienvault?.malware_families && details.related.alienvault.malware_families.length > 0 && (
              <div className="otx-detail-section full-width">
                <div className="otx-detail-header">
                  <AlertTriangle size={16} />
                  Malware Families
                </div>
                <div className="otx-tags">
                  {details.related.alienvault.malware_families.map((family: string, index: number) => (
                    <span key={index} className="otx-tag malware">{family}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Targeted Industries */}
            {details?.related?.alienvault?.industries && details.related.alienvault.industries.length > 0 && (
              <div className="otx-detail-section full-width">
                <div className="otx-detail-header">
                  <Target size={16} />
                  Targeted Industries
                </div>
                <div className="otx-tags">
                  {details.related.alienvault.industries.map((industry: string, index: number) => (
                    <span key={index} className="otx-tag industry">{industry}</span>
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
