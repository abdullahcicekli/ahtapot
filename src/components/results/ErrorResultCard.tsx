import React from 'react';
import { IOCAnalysisResult } from '@/types/ioc';
import { AlertCircle, XCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import { getIOCTypeLabel } from '@/utils/ioc-detector';
import './ErrorResultCard.css';

interface ErrorResultCardProps {
  result: IOCAnalysisResult;
}

export const ErrorResultCard: React.FC<ErrorResultCardProps> = ({ result }) => {
  const { t } = useTranslation('results');
  const { ioc, source, error } = result;

  // Parse error message for status code if present
  const parseError = (errorMsg: string | undefined) => {
    if (!errorMsg) return { code: null, message: t('error.unknown') };
    
    // Try to extract HTTP status code from error message
    const codeMatch = errorMsg.match(/\((\d{3})\)/);
    const statusCode = codeMatch ? parseInt(codeMatch[1]) : null;
    
    return {
      code: statusCode,
      message: errorMsg
    };
  };

  const { code, message } = parseError(error);

  // Get human-readable error type
  const getErrorType = () => {
    if (!code) return t('error.types.apiError');
    
    if (code === 401 || code === 403) return t('error.types.authError');
    if (code === 404) return t('error.types.notFound');
    if (code === 429) return t('error.types.rateLimit');
    if (code >= 500) return t('error.types.serverError');
    if (code >= 400) return t('error.types.clientError');
    
    return t('error.types.apiError');
  };

  // Get error icon based on type
  const getErrorIcon = () => {
    if (code === 401 || code === 403) {
      return <AlertCircle size={24} className="error-icon auth" />;
    }
    if (code === 429) {
      return <RefreshCw size={24} className="error-icon rate-limit" />;
    }
    return <XCircle size={24} className="error-icon default" />;
  };

  return (
    <div className="error-result-card">
      {/* Header */}
      <div className="error-result-header">
        <div className="error-result-header-left">
          {getErrorIcon()}
          <div className="error-result-info">
            <div className="error-result-source">{source}</div>
            <div className="error-result-type-badge">{getErrorType()}</div>
          </div>
        </div>
        
        <div className="error-result-header-right">
          <div className="error-result-ioc-info">
            <div className="error-result-ioc-value">{ioc.value}</div>
            <div className="error-result-ioc-type">{getIOCTypeLabel(ioc.type)}</div>
          </div>
        </div>
        
        <div className="error-result-status">
          <div className="error-status-badge">
            <XCircle size={14} />
            <span>{t('error.status')}</span>
          </div>
        </div>
      </div>

      {/* Error Details */}
      <div className="error-result-content">
        <div className="error-result-message">
          <AlertCircle size={16} />
          <div className="error-message-text">
            {code && (
              <span className="error-code">HTTP {code}</span>
            )}
            <span className="error-description">{message}</span>
          </div>
        </div>

        {/* Troubleshooting Tips */}
        <div className="error-result-tips">
          <div className="error-tips-title">{t('error.possibleCauses')}</div>
          <ul className="error-tips-list">
            {(code === 401 || code === 403) ? (
              <>
                <li>{t('error.tips.invalidApiKey')}</li>
                <li>{t('error.tips.expiredApiKey')}</li>
                <li>{t('error.tips.checkSettings')}</li>
              </>
            ) : code === 429 ? (
              <>
                <li>{t('error.tips.rateLimitExceeded')}</li>
                <li>{t('error.tips.waitAndRetry')}</li>
                <li>{t('error.tips.upgradePlan')}</li>
              </>
            ) : code && code >= 500 ? (
              <>
                <li>{t('error.tips.serverIssue')}</li>
                <li>{t('error.tips.tryAgainLater')}</li>
                <li>{t('error.tips.checkStatus')}</li>
              </>
            ) : (
              <>
                <li>{t('error.tips.checkApiKey')}</li>
                <li>{t('error.tips.networkIssue')}</li>
                <li>{t('error.tips.tryAgainLater')}</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

/**
 * Check if a result should be rendered as an error card
 */
export const isErrorResult = (result: IOCAnalysisResult): boolean => {
  return result.status === 'error' && !!result.error && !result.unsupportedReason;
};

