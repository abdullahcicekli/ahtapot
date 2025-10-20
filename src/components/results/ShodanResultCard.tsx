import React from 'react';
import { IOCAnalysisResult } from '@/types/ioc';
import { getIOCTypeLabel } from '@/utils/ioc-detector';
import {
  AlertTriangle,
  Info,
  Shield,
  Globe,
  Building2,
  Server,
  MapPin,
  Hash,
  AlertCircle,
} from 'lucide-react';
import './ShodanResultCard.css';

interface ShodanResultCardProps {
  result: IOCAnalysisResult;
}

export const ShodanResultCard: React.FC<ShodanResultCardProps> = ({ result }) => {
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
        return 'Safe';
      case 'suspicious':
        return 'Suspicious';
      case 'malicious':
        return 'Malicious';
      case 'error':
        // Show the actual error message instead of just "Error"
        return resultError || details?.error || 'Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="shodan-result-card">
      {/* Header */}
      <div className="shodan-header">
        <div className="shodan-header-left">
          <div className="shodan-logo">
            <img src="/provider-icons/shodan-logo.png" alt="Shodan" />
          </div>
          <div className="shodan-info">
            <div className="shodan-title">Shodan</div>
            <div className="shodan-subtitle">Internet Device Search</div>
          </div>
        </div>

        <div className="shodan-header-right">
          <div className="shodan-ioc-info">
            <div className="shodan-ioc-value">{result.ioc.value}</div>
            <div className="shodan-ioc-type">{getIOCTypeLabel(result.ioc.type)}</div>
          </div>
        </div>

        <div className="shodan-header-actions">
          <div className={`shodan-status-badge ${status}`}>
            {getStatusIcon()}
            <span>{getStatusText()}</span>
          </div>
        </div>
      </div>

      {/* Unsupported IOC Type */}
      {result.unsupportedReason && result.supportedTypes && (
        <div className="shodan-unsupported">
          <div className="shodan-unsupported-message">
            <AlertTriangle size={16} />
            <span>{result.unsupportedReason}</span>
          </div>
          <div className="shodan-supported-types">
            <span className="shodan-supported-label">Supported IOC types:</span>
            <div className="shodan-supported-badges">
              {result.supportedTypes.map((type, idx) => (
                <span key={idx} className="shodan-ioc-badge">
                  {getIOCTypeLabel(type)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Summary */}
      {details?.summary && !details?.message && (
        <div className="shodan-summary">
          <Info size={16} />
          <span>{details.summary}</span>
        </div>
      )}

      {/* Content - Host Information */}
      {!details?.message && details?.ip && (
        <div className="shodan-content">
          <div className="shodan-overview-grid">
            {/* Basic Information */}
            <div className="shodan-metric-card">
              <div className="shodan-metric-header">
                <Server size={18} />
                <span>Host Information</span>
              </div>
              <div className="shodan-metric-body">
                <div className="shodan-metric-item">
                  <span className="shodan-metric-label">IP Address:</span>
                  <span className="shodan-metric-value monospace">{details.ip}</span>
                </div>
                {details.os && (
                  <div className="shodan-metric-item">
                    <span className="shodan-metric-label">Operating System:</span>
                    <span className="shodan-metric-value">{details.os}</span>
                  </div>
                )}
                {details.lastUpdate && (
                  <div className="shodan-metric-item">
                    <span className="shodan-metric-label">Last Scan:</span>
                    <span className="shodan-metric-value">
                      {new Date(details.lastUpdate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Organization Information */}
            <div className="shodan-metric-card">
              <div className="shodan-metric-header">
                <Building2 size={18} />
                <span>Organization</span>
              </div>
              <div className="shodan-metric-body">
                {details.organization && (
                  <div className="shodan-metric-item">
                    <span className="shodan-metric-label">Organization:</span>
                    <span className="shodan-metric-value">{details.organization}</span>
                  </div>
                )}
                {details.isp && (
                  <div className="shodan-metric-item">
                    <span className="shodan-metric-label">ISP:</span>
                    <span className="shodan-metric-value">{details.isp}</span>
                  </div>
                )}
                {details.asn && (
                  <div className="shodan-metric-item">
                    <span className="shodan-metric-label">ASN:</span>
                    <span className="shodan-metric-value monospace">{details.asn}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Location Information */}
            {details.country && (
              <div className="shodan-metric-card">
                <div className="shodan-metric-header">
                  <MapPin size={18} />
                  <span>Location</span>
                </div>
                <div className="shodan-metric-body">
                  <div className="shodan-metric-item">
                    <span className="shodan-metric-label">Country:</span>
                    <span className="shodan-metric-value">
                      {details.countryCode && `${details.countryCode} - `}{details.country}
                    </span>
                  </div>
                  {details.city && (
                    <div className="shodan-metric-item">
                      <span className="shodan-metric-label">City:</span>
                      <span className="shodan-metric-value">{details.city}</span>
                    </div>
                  )}
                  {details.latitude && details.longitude && (
                    <div className="shodan-metric-item">
                      <span className="shodan-metric-label">Coordinates:</span>
                      <span className="shodan-metric-value monospace">
                        {details.latitude.toFixed(4)}, {details.longitude.toFixed(4)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ports and Services */}
            <div className="shodan-metric-card">
              <div className="shodan-metric-header">
                <Hash size={18} />
                <span>Ports ({details.totalPorts || 0})</span>
              </div>
              <div className="shodan-metric-body">
                {details.openPorts && details.openPorts.length > 0 && (
                  <div className="shodan-ports-list">
                    {details.openPorts.slice(0, 15).map((port: number, index: number) => (
                      <span key={index} className="shodan-port-badge">
                        {port}
                      </span>
                    ))}
                    {details.openPorts.length > 15 && (
                      <span className="shodan-port-badge">
                        +{details.openPorts.length - 15} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Vulnerabilities */}
            {details.totalVulnerabilities > 0 && (
              <div className="shodan-metric-card full-width">
                <div className="shodan-metric-header">
                  <AlertTriangle size={18} />
                  <span>Vulnerabilities ({details.totalVulnerabilities})</span>
                </div>
                <div className="shodan-vulnerabilities">
                  {details.vulnerabilities?.slice(0, 10).map((vuln: string, index: number) => (
                    <div key={index} className="shodan-vulnerability">
                      {vuln}
                    </div>
                  ))}
                  {details.vulnerabilities?.length > 10 && (
                    <div className="shodan-vulnerability">
                      +{details.vulnerabilities.length - 10} more vulnerabilities
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Services */}
            {details.services && details.services.length > 0 && (
              <div className="shodan-metric-card full-width">
                <div className="shodan-metric-header">
                  <Server size={18} />
                  <span>Detected Services ({details.services.length})</span>
                </div>
                <div className="shodan-services">
                  {details.services.slice(0, 12).map((service: any, index: number) => (
                    <div key={index} className="shodan-service">
                      <div className="shodan-service-header">
                        <span className="shodan-service-port">Port {service.port}</span>
                        <span className="shodan-service-protocol">{service.protocol}</span>
                      </div>
                      {service.product && (
                        <div className="shodan-service-product">{service.product}</div>
                      )}
                      {service.version && (
                        <div className="shodan-service-version">v{service.version}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hostnames */}
            {details.hostnames && details.hostnames.length > 0 && (
              <div className="shodan-metric-card full-width">
                <div className="shodan-metric-header">
                  <Globe size={18} />
                  <span>Hostnames ({details.hostnames.length})</span>
                </div>
                <div className="shodan-hostnames">
                  {details.hostnames.map((hostname: string, index: number) => (
                    <div key={index} className="shodan-hostname">
                      {hostname}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {details.tags && details.tags.length > 0 && (
              <div className="shodan-metric-card full-width">
                <div className="shodan-metric-header">
                  <Info size={18} />
                  <span>Tags</span>
                </div>
                <div className="shodan-tags">
                  {details.tags.map((tag: string, index: number) => (
                    <span key={index} className="shodan-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* View on Shodan Link */}
          <div className="shodan-external-link">
            <a
              href={`https://www.shodan.io/host/${result.ioc.value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shodan-link-button"
            >
              View Full Report on Shodan →
            </a>
          </div>
        </div>
      )}

      {/* Content - Domain Information */}
      {!details?.message && details?.domain && (
        <div className="shodan-content">
          <div className="shodan-overview-grid">
            {/* Domain Information */}
            <div className="shodan-metric-card full-width">
              <div className="shodan-metric-header">
                <Globe size={18} />
                <span>Domain Information</span>
              </div>
              <div className="shodan-metric-body">
                <div className="shodan-metric-item">
                  <span className="shodan-metric-label">Domain:</span>
                  <span className="shodan-metric-value monospace">{details.domain}</span>
                </div>
                {details.totalSubdomains > 0 && (
                  <div className="shodan-metric-item">
                    <span className="shodan-metric-label">Subdomains:</span>
                    <span className="shodan-metric-value">{details.totalSubdomains}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Subdomains */}
            {details.subdomains && details.subdomains.length > 0 && (
              <div className="shodan-metric-card full-width">
                <div className="shodan-metric-header">
                  <Server size={18} />
                  <span>Subdomains ({details.subdomains.length})</span>
                </div>
                <div className="shodan-hostnames">
                  {details.subdomains.slice(0, 20).map((subdomain: string, index: number) => (
                    <div key={index} className="shodan-hostname">
                      {subdomain}
                    </div>
                  ))}
                  {details.subdomains.length > 20 && (
                    <div className="shodan-hostname">
                      +{details.subdomains.length - 20} more subdomains
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {details.tags && details.tags.length > 0 && (
              <div className="shodan-metric-card full-width">
                <div className="shodan-metric-header">
                  <Info size={18} />
                  <span>Tags</span>
                </div>
                <div className="shodan-tags">
                  {details.tags.map((tag: string, index: number) => (
                    <span key={index} className="shodan-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* View on Shodan Link */}
          <div className="shodan-external-link">
            <a
              href={`https://www.shodan.io/domain/${result.ioc.value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shodan-link-button"
            >
              View Full Report on Shodan →
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
