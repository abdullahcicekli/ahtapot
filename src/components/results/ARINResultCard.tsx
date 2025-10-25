import React from 'react';
import { IOCAnalysisResult } from '@/types/ioc';
import { getIOCTypeLabel } from '@/utils/ioc-detector';
import {
  AlertTriangle,
  Info,
  Network,
  Calendar,
  Building2,
  Hash,
  FileText,
} from 'lucide-react';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import './ARINResultCard.css';

interface ARINResultCardProps {
  result: IOCAnalysisResult;
}

export const ARINResultCard: React.FC<ARINResultCardProps> = ({ result }) => {
  const { t } = useTranslation('results');
  const { details } = result;

  const networkName = details?.networkName || 'Unknown';
  const organizationName = details?.organizationName || 'N/A';
  const networkRange = details?.networkRange || 'N/A';
  const cidr = details?.cidr || 'N/A';
  const ipVersion = details?.ipVersion || 4;

  return (
    <div className="arin-result-card">
      {/* Header */}
      <div className="arin-header">
        <div className="arin-header-left">
          <div className="arin-network-icon">
            <Network size={28} />
          </div>
          <div className="arin-network-info">
            <div className="arin-network-title">{t('arin.header.title')}</div>
            <div className="arin-network-subtitle">
              <span className="arin-network-name">{networkName}</span>
            </div>
          </div>
        </div>

        <div className="arin-header-right">
          <div className="arin-ioc-info">
            <div className="arin-ioc-value">{result.ioc.value}</div>
            <div className="arin-ioc-type">IPv{ipVersion}</div>
          </div>
        </div>

        <div className="arin-header-actions">
          <div className="arin-status-badge info">
            <Info size={16} />
            <span>{t('arin.status.whoisInfo')}</span>
          </div>
        </div>
      </div>

      {/* IP Not Found Message */}
      {details?.message && (
        <div className="arin-not-found">
          <div className="arin-not-found-message">
            <AlertTriangle size={16} />
            <span>{details.message}</span>
          </div>
          {details.note && (
            <div className="arin-not-found-note">
              <Info size={14} />
              <span>{details.note}</span>
            </div>
          )}
        </div>
      )}

      {/* Unsupported IOC Type */}
      {result.unsupportedReason && result.supportedTypes && (
        <div className="arin-unsupported">
          <div className="arin-unsupported-message">
            <AlertTriangle size={16} />
            <span>{result.unsupportedReason}</span>
          </div>
          <div className="arin-supported-types">
            <span className="arin-supported-label">{t('arin.unsupportedType')}</span>
            <div className="arin-supported-badges">
              {result.supportedTypes.map((type, idx) => (
                <span key={idx} className="arin-ioc-badge">
                  {getIOCTypeLabel(type)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Summary */}
      {details?.summary && !details?.message && (
        <div className="arin-summary">
          <Info size={16} />
          <span>{details.summary}</span>
        </div>
      )}

      {/* Content */}
      {!details?.message && (
        <div className="arin-content">
              <div className="arin-overview-grid">
                {/* Network Information */}
                <div className="arin-metric-card">
                  <div className="arin-metric-header">
                    <Network size={18} />
                    <span>{t('arin.network.title')}</span>
                  </div>
                  <div className="arin-metric-body">
                    <div className="arin-metric-item">
                      <span className="arin-metric-label">{t('arin.network.networkName')}</span>
                      <span className="arin-metric-value">{details?.networkName}</span>
                    </div>
                    <div className="arin-metric-item">
                      <span className="arin-metric-label">{t('arin.network.handle')}</span>
                      <span className="arin-metric-value">{details?.networkHandle}</span>
                    </div>
                    <div className="arin-metric-item">
                      <span className="arin-metric-label">{t('arin.network.ipVersion')}</span>
                      <span className="arin-metric-value">IPv{ipVersion}</span>
                    </div>
                    <div className="arin-metric-item">
                      <span className="arin-metric-label">{t('arin.network.cidr')}</span>
                      <span className="arin-metric-value monospace">{cidr}</span>
                    </div>
                  </div>
                </div>

                {/* Organization Information */}
                <div className="arin-metric-card">
                  <div className="arin-metric-header">
                    <Building2 size={18} />
                    <span>{t('arin.organization.title')}</span>
                  </div>
                  <div className="arin-metric-body">
                    <div className="arin-metric-item">
                      <span className="arin-metric-label">{t('arin.organization.organization')}</span>
                      <span className="arin-metric-value">{organizationName}</span>
                    </div>
                    {details?.organizationHandle && (
                      <div className="arin-metric-item">
                        <span className="arin-metric-label">{t('arin.organization.orgHandle')}</span>
                        <span className="arin-metric-value">{details.organizationHandle}</span>
                      </div>
                    )}
                    {details?.hasCustomerRef && (
                      <div className="arin-metric-item">
                        <span className="arin-metric-label">{t('arin.organization.type')}</span>
                        <span className="arin-metric-value">{t('arin.organization.customerAssignment')}</span>
                      </div>
                    )}
                    {details?.parentNetName && (
                      <div className="arin-metric-item">
                        <span className="arin-metric-label">{t('arin.organization.parentNetwork')}</span>
                        <span className="arin-metric-value">{details.parentNetName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address Range */}
                <div className="arin-metric-card full-width">
                  <div className="arin-metric-header">
                    <Hash size={18} />
                    <span>{t('arin.addressRange.title')}</span>
                  </div>
                  <div className="arin-metric-body">
                    <div className="arin-metric-item">
                      <span className="arin-metric-label">{t('arin.addressRange.startAddress')}</span>
                      <span className="arin-metric-value monospace">{details?.startAddress}</span>
                    </div>
                    <div className="arin-metric-item">
                      <span className="arin-metric-label">{t('arin.addressRange.endAddress')}</span>
                      <span className="arin-metric-value monospace">{details?.endAddress}</span>
                    </div>
                    <div className="arin-metric-item">
                      <span className="arin-metric-label">{t('arin.addressRange.range')}</span>
                      <span className="arin-metric-value monospace">{networkRange}</span>
                    </div>
                  </div>
                </div>

                {/* Registration Dates */}
                <div className="arin-metric-card full-width">
                  <div className="arin-metric-header">
                    <Calendar size={18} />
                    <span>{t('arin.registration.title')}</span>
                  </div>
                  <div className="arin-metric-body">
                    {details?.registrationDate && (
                      <div className="arin-metric-item">
                        <span className="arin-metric-label">{t('arin.registration.registrationDate')}</span>
                        <span className="arin-metric-value">
                          {new Date(details.registrationDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                    {details?.updateDate && (
                      <div className="arin-metric-item">
                        <span className="arin-metric-label">{t('arin.registration.lastUpdated')}</span>
                        <span className="arin-metric-value">
                          {new Date(details.updateDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Comments */}
                {details?.comments && details.comments.length > 0 && (
                  <div className="arin-metric-card full-width">
                    <div className="arin-metric-header">
                      <FileText size={18} />
                      <span>{t('arin.comments.title')}</span>
                    </div>
                    <div className="arin-comments">
                      {details.comments.map((comment: string, index: number) => (
                        <div key={index} className="arin-comment">
                          {comment}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Net Blocks */}
                {details?.netBlocks && details.netBlocks.length > 0 && (
                  <div className="arin-metric-card full-width">
                    <div className="arin-metric-header">
                      <Hash size={18} />
                      <span>{t('arin.netBlocks.title')}</span>
                    </div>
                    <div className="arin-netblocks">
                      {details.netBlocks.map((block: any, index: number) => (
                        <div key={index} className="arin-netblock">
                          <div className="arin-netblock-header">
                            <span className="arin-netblock-type">{block.type}</span>
                          </div>
                          <div className="arin-netblock-range">
                            {block.startAddress} - {block.endAddress}
                          </div>
                          <div className="arin-netblock-cidr">
                            /{block.cidrLength}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* View on ARIN Link */}
              <div className="arin-external-link">
                <a
                  href={`https://whois.arin.net/rest/ip/${result.ioc.value}.html`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="arin-link-button"
                >
                  {t('arin.viewFullWhois')}
                </a>
              </div>
            </div>
      )}
    </div>
  );
};
