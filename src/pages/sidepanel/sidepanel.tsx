import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import {
  Search,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader,
  Settings,
  ExternalLink,
} from 'lucide-react';
import { DetectedIOC, IOCAnalysisResult, APIProvider, IOCType } from '@/types/ioc';
import { detectIOCs, getIOCTypeLabel } from '@/utils/ioc-detector';
import { MessageType } from '@/types/messages';
import { ProviderStatusBadges } from '@/components/ProviderStatusBadges';
import { VirusTotalResultCard } from '@/components/results/VirusTotalResultCard';
import { OTXResultCard } from '@/components/results/OTXResultCard';
import { AbuseIPDBResultCard } from '@/components/results/AbuseIPDBResultCard';
import { MalwareBazaarResultCard } from '@/components/results/MalwareBazaarResultCard';
import { ARINResultCard } from '@/components/results/ARINResultCard';
import { ShodanResultCard } from '@/components/results/ShodanResultCard';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import '@/i18n/config';
import './sidepanel.css';

// Provider support mapping - mirrors backend service capabilities
const PROVIDER_SUPPORT: Record<string, IOCType[]> = {
  'AbuseIPDB': [IOCType.IPV4, IOCType.IPV6],
  'VirusTotal': [IOCType.IPV4, IOCType.IPV6, IOCType.DOMAIN, IOCType.URL, IOCType.MD5, IOCType.SHA1, IOCType.SHA256],
  'OTX AlienVault': [IOCType.IPV4, IOCType.IPV6, IOCType.DOMAIN, IOCType.URL, IOCType.MD5, IOCType.SHA1, IOCType.SHA256, IOCType.CVE],
  'MalwareBazaar': [IOCType.MD5, IOCType.SHA1, IOCType.SHA256],
  'ARIN': [IOCType.IPV4, IOCType.IPV6],
  'Shodan': [IOCType.IPV4, IOCType.IPV6, IOCType.DOMAIN],
};

// Get providers that support a specific IOC type
const getSupportingProviders = (iocType: IOCType): string[] => {
  return Object.entries(PROVIDER_SUPPORT)
    .filter(([_, types]) => types.includes(iocType))
    .map(([provider]) => provider);
};

const SidePanel: React.FC = () => {
  const { t } = useTranslation('sidepanel');
  const tCommon = useTranslation('common').t;

  const [inputText, setInputText] = useState('');
  const [detectedIOCs, setDetectedIOCs] = useState<DetectedIOC[]>([]);
  const [results, setResults] = useState<IOCAnalysisResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzingProviders, setAnalyzingProviders] = useState<APIProvider[]>([]);
  const [completedProviders, setCompletedProviders] = useState<{ provider: APIProvider; status: 'success' | 'error' }[]>([]);
  const [hasApiKeys, setHasApiKeys] = useState<boolean | null>(null);
  const [activeProviderTab, setActiveProviderTab] = useState<string>('');
  const [isInputExpanded, setIsInputExpanded] = useState(true);

  useEffect(() => {
    checkAPIKeys();

    const handleStorageChange = (changes: any) => {
      if (changes.apiKeys) {
        checkAPIKeys();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const messageListener = (message: any) => {
      if (message.type === MessageType.OPEN_SIDEPANEL) {
        if (message.payload.iocs) {
          const iocs = message.payload.iocs as DetectedIOC[];
          setDetectedIOCs(iocs);
          handleAnalyze(undefined, iocs);
        } else {
          const text = message.payload.selectedText || '';
          setInputText(text);
          handleAnalyze(text);
        }
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  async function checkAPIKeys() {
    try {
      const result = await chrome.storage.local.get('apiKeys');
      const apiKeys = result.apiKeys || {};

      // Support both old format (string) and new format (object with key)
      const hasKeys = Object.values(apiKeys).some((value: any) => {
        if (typeof value === 'string') {
          return value.trim() !== '';
        } else if (value && typeof value === 'object' && 'key' in value) {
          return value.key && String(value.key).trim() !== '';
        }
        return false;
      });

      setHasApiKeys(hasKeys);
    } catch (error) {
      console.error('Error checking API keys:', error);
      setHasApiKeys(false);
    }
  }

  const handleDetect = () => {
    const iocs = detectIOCs(inputText);
    setDetectedIOCs(iocs);
    setResults([]);
  };

  const handleAnalyze = async (text?: string, providedIOCs?: DetectedIOC[]) => {
    const textToAnalyze = text || inputText;
    const iocs = providedIOCs || detectIOCs(textToAnalyze);

    if (iocs.length === 0) {
      return;
    }

    setDetectedIOCs(iocs);
    setLoading(true);
    setResults([]);
    setCompletedProviders([]);
    setActiveProviderTab(''); // Reset active tab when starting new analysis
    setIsInputExpanded(false); // Collapse input when analysis starts

    if (hasApiKeys === false) {
      setLoading(false);
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: MessageType.ANALYZE_IOC,
        payload: { iocs },
      });

      if (response && response.success) {
        const responseResults = response.results || [];
        setResults(responseResults);

        // Always set first provider with results as active tab
        if (responseResults.length > 0) {
          setActiveProviderTab(responseResults[0].source);
        }

        if (response.analyzingProviders) {
          setAnalyzingProviders(response.analyzingProviders);
        }
        if (response.completedProviders) {
          setCompletedProviders(response.completedProviders);
        }
      }
    } catch (error) {
      console.error('[Sidepanel] Error analyzing IOCs:', error);
    } finally {
      setLoading(false);
      setAnalyzingProviders([]);
    }
  };

  const getStatusIcon = (status: IOCAnalysisResult['status']) => {
    switch (status) {
      case 'safe':
        return <CheckCircle className="status-icon safe" />;
      case 'suspicious':
        return <AlertTriangle className="status-icon suspicious" />;
      case 'malicious':
        return <XCircle className="status-icon malicious" />;
      case 'error':
        return <XCircle className="status-icon error" />;
      default:
        return <Shield className="status-icon unknown" />;
    }
  };

  const getStatusLabel = (status: IOCAnalysisResult['status']) => {
    return tCommon(`status.${status}`);
  };

  return (
    <div className="sidepanel-container">
      <header className="sidepanel-header">
        <div className="header-title">
          <img
            src="/icons/logo-white.png"
            alt={t('header.logoAlt')}
            className="header-logo"
          />
        </div>
        <div className="header-actions">
          <button
            onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('src/pages/options/index.html') })}
            className="settings-btn"
            title={t('header.settingsTitle')}
            aria-label={t('header.settingsLabel')}
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      <main className="sidepanel-main">
        {hasApiKeys === false && (
          <div className="warning-card">
            <AlertTriangle size={20} />
            <div className="warning-content">
              <strong>{t('apiWarning.title')}</strong>
              <p>{t('apiWarning.description')}</p>
              <button
                onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('src/pages/options/index.html?tab=apiKeys') })}
                className="setup-btn"
              >
                {t('apiWarning.configureButton')}
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
        )}

        <div className={`input-section ${isInputExpanded ? 'expanded' : 'collapsed'}`}>
          {!isInputExpanded && (
            <div className="input-collapsed-header" onClick={() => setIsInputExpanded(true)}>
              <Search size={16} />
              <span>{inputText || t('input.label')}</span>
              <span className="expand-hint">Click to edit</span>
            </div>
          )}

          {isInputExpanded && (
            <>
              <label htmlFor="ioc-input" className="input-label">
                {t('input.label')}
              </label>
              <textarea
                id="ioc-input"
                placeholder={t('input.placeholder')}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="ioc-input"
                rows={6}
              />
              <div className="input-actions">
                <button onClick={handleDetect} className="detect-btn">
                  <Search size={18} />
                  {t('input.detectButton')}
                </button>
                <button
                  onClick={() => handleAnalyze()}
                  className="analyze-btn"
                  disabled={detectedIOCs.length === 0 || loading || hasApiKeys === false}
                >
                  {loading ? (
                    <>
                      <Loader size={18} className="spinner" />
                      {t('input.analyzingButton')}
                    </>
                  ) : (
                    <>
                      <Shield size={18} />
                      {t('input.analyzeButton')}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        <ProviderStatusBadges
          analyzingProviders={analyzingProviders}
          completedProviders={completedProviders}
          activeProvider={activeProviderTab}
          onProviderClick={(providerName) => {
            // Always switch to the clicked provider tab
            // The UI will show either results or a "no results" message
            setActiveProviderTab(providerName);
          }}
        />

        {detectedIOCs.length > 0 && results.length === 0 && (
          <div className="detected-section">
            <h2 className="section-title">
              {t('detected.title')} ({detectedIOCs.length})
            </h2>
            <div className="ioc-list">
              {detectedIOCs.map((ioc, index) => {
                const supportingProviders = getSupportingProviders(ioc.type);
                return (
                  <div key={index} className="ioc-item">
                    <div className="ioc-item-header">
                      <div className="ioc-type">{getIOCTypeLabel(ioc.type)}</div>
                      <div className="ioc-value">{ioc.value}</div>
                    </div>
                    <div className="ioc-providers">
                      <span className="ioc-providers-label">{t('detected.supportedBy')}</span>
                      <div className="ioc-providers-badges">
                        {supportingProviders.map((provider, idx) => (
                          <span key={idx} className="ioc-provider-badge">
                            {provider}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="results-section">
            <h2 className="section-title">{t('results.title')}</h2>

            {/* Active Provider Results */}
            <div className="results-list">
              {(() => {
                const filteredResults = results.filter((result) => result.source === activeProviderTab);

                // If no results for active provider, show informative empty state
                if (filteredResults.length === 0 && activeProviderTab) {
                  const supportedTypes = PROVIDER_SUPPORT[activeProviderTab] || [];
                  return (
                    <div className="provider-no-results">
                      <Shield size={48} />
                      <h3>{t('providerNoResults.title', { provider: activeProviderTab })}</h3>
                      <p>{t('providerNoResults.description')}</p>

                      {supportedTypes.length > 0 && (
                        <div className="provider-supported-types">
                          <span className="provider-supported-label">
                            {t('providerNoResults.supportedLabel', { provider: activeProviderTab })}
                          </span>
                          <div className="provider-supported-badges">
                            {supportedTypes.map((type, idx) => (
                              <span key={idx} className="ioc-type-badge">
                                {getIOCTypeLabel(type)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return filteredResults.map((result, index) => {
                  if (result.source === 'VirusTotal') {
                    return <VirusTotalResultCard key={index} result={result} />;
                  }

                  if (result.source === 'OTX AlienVault') {
                    return <OTXResultCard key={index} result={result} />;
                  }

                  if (result.source === 'AbuseIPDB') {
                    return <AbuseIPDBResultCard key={index} result={result} />;
                  }

                  if (result.source === 'MalwareBazaar') {
                    return <MalwareBazaarResultCard key={index} result={result} />;
                  }

                  if (result.source === 'ARIN') {
                    return <ARINResultCard key={index} result={result} />;
                  }

                  if (result.source === 'Shodan') {
                    return <ShodanResultCard key={index} result={result} />;
                  }

                  return (
                    <div key={index} className="result-card">
                      <div className="result-header">
                        {getStatusIcon(result.status)}
                        <div className="result-info">
                          <div className="result-value">{result.ioc.value}</div>
                          <div className="result-meta">
                            <span className="result-type">
                              {getIOCTypeLabel(result.ioc.type)}
                            </span>
                            <span className="result-source">{result.source}</span>
                          </div>
                        </div>
                        <div className={`result-status ${result.status}`}>
                          {getStatusLabel(result.status)}
                        </div>
                      </div>
                      {result.unsupportedReason && result.supportedTypes && (
                        <div className="result-unsupported">
                          <div className="unsupported-message">
                            <AlertTriangle size={16} />
                            <span>{result.unsupportedReason}</span>
                          </div>
                          <div className="supported-types">
                            <span className="supported-types-label">Supported IOC types:</span>
                            <div className="supported-types-badges">
                              {result.supportedTypes.map((type, idx) => (
                                <span key={idx} className="ioc-type-badge">
                                  {getIOCTypeLabel(type)}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      {result.details && (
                        <div className="result-details">
                          {result.details.message || JSON.stringify(result.details)}
                        </div>
                      )}
                      {result.error && !result.unsupportedReason && (
                        <div className="result-error">{result.error}</div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {!loading && detectedIOCs.length === 0 && inputText && (
          <div className="empty-state">
            <Search size={48} />
            <h3>{t('emptyState.noDetection.title')}</h3>
            <p>{t('emptyState.noDetection.description')}</p>
          </div>
        )}

        {!inputText && !loading && detectedIOCs.length === 0 && results.length === 0 && (
          <div className="welcome-state">
            <Shield size={64} />
            <h2>{t('emptyState.welcome.title')}</h2>
            <p>{t('emptyState.welcome.description')}</p>
            <div className="supported-iocs">
              <h3>{t('emptyState.welcome.supportedTitle')}</h3>
              <ul>
                <li>{t('emptyState.welcome.types.ipAddresses')}</li>
                <li>{t('emptyState.welcome.types.domains')}</li>
                <li>{t('emptyState.welcome.types.hashes')}</li>
                <li>{t('emptyState.welcome.types.emails')}</li>
                <li>{t('emptyState.welcome.types.cve')}</li>
                <li>{t('emptyState.welcome.types.crypto')}</li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(<SidePanel />);
}
