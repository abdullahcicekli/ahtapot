import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { useTranslation } from 'react-i18next';
import { Save, CheckCircle, AlertCircle, Eye, EyeOff, Info, ExternalLink, Settings, Key, Globe, Database, Trash2, Loader } from 'lucide-react';
import { APIProvider } from '@/types/ioc';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n/config';
import { APIKeyValidator } from '@/utils/apiValidator';
import { CacheManager, CacheSettings } from '@/utils/cacheManager';
import '@/i18n/config';
import './options.css';

type TabType = 'general' | 'apiKeys';

interface APIKeyConfig {
  provider: APIProvider;
  label: string;
  link: string;
  signupLink: string;
}

interface APIKeyState {
  value: string;
  isValidating: boolean;
  validationResult: 'valid' | 'invalid' | null;
  validationError?: string;
  hasChanges: boolean;
  isSaving: boolean;
  saveSuccess: boolean;
}

const API_CONFIGS: APIKeyConfig[] = [
  {
    provider: APIProvider.VIRUSTOTAL,
    label: 'VirusTotal',
    link: 'https://www.virustotal.com/gui/my-apikey',
    signupLink: 'https://www.virustotal.com/gui/join-us',
  },
  {
    provider: APIProvider.SHODAN,
    label: 'Shodan',
    link: 'https://account.shodan.io/',
    signupLink: 'https://account.shodan.io/register',
  },
  {
    provider: APIProvider.ABUSEIPDB,
    label: 'AbuseIPDB',
    link: 'https://www.abuseipdb.com/account/api',
    signupLink: 'https://www.abuseipdb.com/register',
  },
  {
    provider: APIProvider.URLSCAN,
    label: 'URLScan.io',
    link: 'https://urlscan.io/user/profile/',
    signupLink: 'https://urlscan.io/user/signup',
  },
  {
    provider: APIProvider.HIBP,
    label: 'Have I Been Pwned',
    link: 'https://haveibeenpwned.com/API/Key',
    signupLink: 'https://haveibeenpwned.com/API/Key',
  },
];

const OptionsPage: React.FC = () => {
  const { t, i18n } = useTranslation(['options', 'common']);
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(i18n.language as SupportedLanguage || 'en');
  const [apiKeyStates, setApiKeyStates] = useState<Record<string, APIKeyState>>({});
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [expandedInfo, setExpandedInfo] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Cache settings state
  const [cacheSettings, setCacheSettings] = useState<CacheSettings>({
    retentionDays: 5,
    enabled: true,
  });
  const [cacheStats, setCacheStats] = useState({
    totalEntries: 0,
    totalSize: 0,
    oldestDate: null as string | null,
    newestDate: null as string | null,
  });
  const [isClearingCache, setIsClearingCache] = useState(false);

  // Load settings
  useEffect(() => {
    loadSettings();
    loadCacheSettings();
  }, []);

  async function loadSettings() {
    try {
      const result = await chrome.storage.local.get(['apiKeys', 'language']);
      const apiKeys = result.apiKeys || {};

      // Initialize state for each provider
      const initialStates: Record<string, APIKeyState> = {};
      API_CONFIGS.forEach((config) => {
        initialStates[config.provider] = {
          value: apiKeys[config.provider] || '',
          isValidating: false,
          validationResult: null,
          hasChanges: false,
          isSaving: false,
          saveSuccess: false,
        };
      });

      setApiKeyStates(initialStates);

      if (result.language) {
        setCurrentLanguage(result.language);
        i18n.changeLanguage(result.language);
      }
    } catch (err) {
      setError(t('actions.errorLoading', { ns: 'options' }));
      console.error('Error loading settings:', err);
    }
  }

  async function loadCacheSettings() {
    try {
      const settings = await CacheManager.getSettings();
      setCacheSettings(settings);

      const stats = await CacheManager.getStatistics();
      setCacheStats(stats);
    } catch (err) {
      console.error('Error loading cache settings:', err);
    }
  }

  // Handle language change
  const handleLanguageChange = async (lang: SupportedLanguage) => {
    try {
      setCurrentLanguage(lang);
      await i18n.changeLanguage(lang);
      await chrome.storage.local.set({ language: lang });
      setError(null);
    } catch (err) {
      setError(t('actions.errorMessage', { ns: 'options' }));
      console.error('Error changing language:', err);
    }
  };

  // Handle API key change
  const handleKeyChange = (provider: APIProvider, value: string) => {
    setApiKeyStates((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        value,
        hasChanges: value !== (prev[provider]?.value || ''),
        validationResult: null,
        saveSuccess: false,
      },
    }));
  };

  // Validate API key
  const handleValidateKey = async (provider: APIProvider) => {
    const state = apiKeyStates[provider];
    if (!state || !state.value) return;

    setApiKeyStates((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        isValidating: true,
        validationResult: null,
        validationError: undefined,
      },
    }));

    try {
      const result = await APIKeyValidator.validate(provider, state.value);

      setApiKeyStates((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          isValidating: false,
          validationResult: result.isValid ? 'valid' : 'invalid',
          validationError: result.error,
        },
      }));
    } catch (err) {
      setApiKeyStates((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          isValidating: false,
          validationResult: 'invalid',
          validationError: t('apiKeys.validationError', { ns: 'options' }),
        },
      }));
    }
  };

  // Save individual API key
  const handleSaveIndividualKey = async (provider: APIProvider) => {
    const state = apiKeyStates[provider];
    if (!state) return;

    setApiKeyStates((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        isSaving: true,
        saveSuccess: false,
      },
    }));

    try {
      // Load current keys
      const result = await chrome.storage.local.get('apiKeys');
      const currentKeys = result.apiKeys || {};

      // Update the specific key
      currentKeys[provider] = state.value;

      // Save back
      await chrome.storage.local.set({ apiKeys: currentKeys });

      setApiKeyStates((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          isSaving: false,
          saveSuccess: true,
          hasChanges: false,
        },
      }));

      // Hide success message after 3 seconds
      setTimeout(() => {
        setApiKeyStates((prev) => ({
          ...prev,
          [provider]: {
            ...prev[provider],
            saveSuccess: false,
          },
        }));
      }, 3000);
    } catch (err) {
      setApiKeyStates((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          isSaving: false,
        },
      }));
      setError(t('actions.errorMessage', { ns: 'options' }));
      console.error('Error saving API key:', err);
    }
  };

  // Toggle visibility
  const toggleVisibility = (provider: string) => {
    setVisibleKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(provider)) {
        newSet.delete(provider);
      } else {
        newSet.add(provider);
      }
      return newSet;
    });
  };

  // Toggle info
  const toggleInfo = (provider: string) => {
    setExpandedInfo((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(provider)) {
        newSet.delete(provider);
      } else {
        newSet.add(provider);
      }
      return newSet;
    });
  };

  // Handle cache settings change
  const handleCacheSettingsChange = async (updates: Partial<CacheSettings>) => {
    try {
      const newSettings = { ...cacheSettings, ...updates };
      setCacheSettings(newSettings);
      await CacheManager.saveSettings(newSettings);

      // Reload stats
      const stats = await CacheManager.getStatistics();
      setCacheStats(stats);
    } catch (err) {
      setError(t('general.cache.clearError', { ns: 'options' }));
      console.error('Error updating cache settings:', err);
    }
  };

  // Clear cache
  const handleClearCache = async () => {
    if (!confirm(t('general.cache.clearConfirm', { ns: 'options' }))) {
      return;
    }

    setIsClearingCache(true);
    try {
      await CacheManager.clearAll();

      // Reload stats
      const stats = await CacheManager.getStatistics();
      setCacheStats(stats);

      setError(null);
    } catch (err) {
      setError(t('general.cache.clearError', { ns: 'options' }));
      console.error('Error clearing cache:', err);
    } finally {
      setIsClearingCache(false);
    }
  };

  // Format bytes to human readable
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '-';
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="options-container">
      <header className="options-header">
        <div className="header-content">
          <img
            src="/icons/logo-white.png"
            alt={t('header.logoAlt', { ns: 'options' })}
            className="header-logo"
          />
          <div className="header-text">
            <h1>{t('header.title', { ns: 'options' })}</h1>
            <p>{t('header.subtitle', { ns: 'options' })}</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <Settings size={18} />
          {t('tabs.general', { ns: 'options' })}
        </button>
        <button
          className={`tab ${activeTab === 'apiKeys' ? 'active' : ''}`}
          onClick={() => setActiveTab('apiKeys')}
        >
          <Key size={18} />
          {t('tabs.apiKeys', { ns: 'options' })}
        </button>
      </div>

      <main className="options-main">
        {/* General Settings Tab */}
        {activeTab === 'general' && (
          <div className="settings-section">
            <h2>{t('general.title', { ns: 'options' })}</h2>

            {/* Language Settings */}
            <div className="setting-card">
              <div className="setting-header">
                <Globe size={20} />
                <div>
                  <h3>{t('general.language.label', { ns: 'options' })}</h3>
                  <p className="setting-description">
                    {t('general.language.description', { ns: 'options' })}
                  </p>
                </div>
              </div>

              <div className="language-selector">
                <select
                  value={currentLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                  className="language-select"
                  aria-label={t('general.language.select', { ns: 'options' })}
                >
                  {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cache Settings */}
            <div className="setting-card">
              <div className="setting-header">
                <Database size={20} />
                <div>
                  <h3>{t('general.cache.title', { ns: 'options' })}</h3>
                  <p className="setting-description">
                    {t('general.cache.description', { ns: 'options' })}
                  </p>
                </div>
              </div>

              <div className="cache-settings">
                {/* Enable/Disable Cache */}
                <div className="cache-setting-row">
                  <label className="cache-checkbox-label">
                    <input
                      type="checkbox"
                      checked={cacheSettings.enabled}
                      onChange={(e) => handleCacheSettingsChange({ enabled: e.target.checked })}
                    />
                    <span>{t('general.cache.enabled', { ns: 'options' })}</span>
                  </label>
                  <p className="cache-description">
                    {t('general.cache.enabledDescription', { ns: 'options' })}
                  </p>
                </div>

                {/* Retention Days */}
                <div className="cache-setting-row">
                  <label className="cache-label">
                    {t('general.cache.retentionDays', { ns: 'options' })}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={cacheSettings.retentionDays}
                    onChange={(e) => handleCacheSettingsChange({ retentionDays: parseInt(e.target.value) || 5 })}
                    className="cache-input"
                    disabled={!cacheSettings.enabled}
                  />
                  <p className="cache-description">
                    {t('general.cache.retentionDescription', { ns: 'options' })}
                  </p>
                </div>

                {/* Cache Statistics */}
                <div className="cache-stats">
                  <h4>{t('general.cache.statistics', { ns: 'options' })}</h4>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">{t('general.cache.totalEntries', { ns: 'options' })}:</span>
                      <span className="stat-value">{cacheStats.totalEntries}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">{t('general.cache.totalSize', { ns: 'options' })}:</span>
                      <span className="stat-value">{formatBytes(cacheStats.totalSize)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">{t('general.cache.oldestDate', { ns: 'options' })}:</span>
                      <span className="stat-value">{formatDate(cacheStats.oldestDate)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">{t('general.cache.newestDate', { ns: 'options' })}:</span>
                      <span className="stat-value">{formatDate(cacheStats.newestDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Clear Cache Button */}
                <button
                  onClick={handleClearCache}
                  className="clear-cache-btn"
                  disabled={isClearingCache || cacheStats.totalEntries === 0}
                >
                  {isClearingCache ? (
                    <>
                      <Loader size={18} className="spinning" />
                      {t('general.cache.clearCache', { ns: 'options' })}
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      {t('general.cache.clearCache', { ns: 'options' })}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* API Keys Tab */}
        {activeTab === 'apiKeys' && (
          <>
            <div className="info-card">
              <AlertCircle size={20} />
              <div>
                <strong>{t('privacyNote.title', { ns: 'options' })}</strong>{' '}
                {t('privacyNote.description', { ns: 'options' })}
              </div>
            </div>

            <div className="api-keys-section">
              <h2>{t('apiKeys.sectionTitle', { ns: 'options' })}</h2>
              <p className="section-description">
                {t('apiKeys.sectionDescription', { ns: 'options' })}
              </p>

              <div className="api-keys-list">
                {API_CONFIGS.map((config) => {
                  const providerKey = config.provider.toLowerCase();
                  const state = apiKeyStates[config.provider];

                  return (
                    <div key={config.provider} className="api-key-card">
                      <div className="api-key-header">
                        <div className="api-key-title-row">
                          <div>
                            <h3>{t(`providers.${providerKey}.label`, { ns: 'options' })}</h3>
                            <p className="api-key-description">
                              {t(`providers.${providerKey}.description`, { ns: 'options' })}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleInfo(config.provider)}
                            className="info-btn"
                            aria-label="API information"
                            title="API limits and features"
                          >
                            <Info size={18} />
                          </button>
                        </div>
                      </div>

                      {expandedInfo.has(config.provider) && (
                        <div className="api-info-box">
                          <div className="api-info-section">
                            <h4>{t('info.limitsTitle', { ns: 'options' })}</h4>
                            <div className="api-limits">
                              <div className="limit-item">
                                <span className="limit-label">
                                  {t('info.dailyLimit', { ns: 'options' })}
                                </span>
                                <span className="limit-value">
                                  {t(`limits.${providerKey}.free`, { ns: 'options' })}
                                </span>
                              </div>
                              <div className="limit-item">
                                <span className="limit-label">
                                  {t('info.rateLimit', { ns: 'options' })}
                                </span>
                                <span className="limit-value">
                                  {t(`limits.${providerKey}.rate`, { ns: 'options' })}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="api-info-section">
                            <h4>{t('info.featuresTitle', { ns: 'options' })}</h4>
                            <ul className="api-features-list">
                              {[1, 2, 3, 4].map((num) => (
                                <li key={num}>
                                  {t(`features.${providerKey}.feature${num}`, { ns: 'options' })}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="api-info-section">
                            <h4>{t('info.howToTitle', { ns: 'options' })}</h4>
                            <ol className="api-steps-list">
                              <li>
                                <a href={config.signupLink} target="_blank" rel="noopener noreferrer">
                                  {t('info.steps.signup', { ns: 'options' })}
                                  <ExternalLink size={14} className="external-icon" />
                                </a>
                              </li>
                              <li>{t('info.steps.verify', { ns: 'options' })}</li>
                              <li>
                                <a href={config.link} target="_blank" rel="noopener noreferrer">
                                  {t('info.steps.getKey', { ns: 'options' })}
                                  <ExternalLink size={14} className="external-icon" />
                                </a>
                              </li>
                              <li>{t('info.steps.paste', { ns: 'options' })}</li>
                            </ol>
                          </div>
                        </div>
                      )}

                      <div className="api-key-input-wrapper">
                        <input
                          type={visibleKeys.has(config.provider) ? 'text' : 'password'}
                          placeholder={t(`providers.${providerKey}.placeholder`, { ns: 'options' })}
                          value={state?.value || ''}
                          onChange={(e) => handleKeyChange(config.provider, e.target.value)}
                          className={`api-key-input ${state?.validationResult === 'invalid' ? 'invalid' : ''}`}
                          aria-label={`${config.label} API key`}
                        />
                        <button
                          type="button"
                          onClick={() => toggleVisibility(config.provider)}
                          className="toggle-visibility-btn"
                          aria-label={
                            visibleKeys.has(config.provider)
                              ? t('apiKeys.hideKey', { ns: 'options' })
                              : t('apiKeys.showKey', { ns: 'options' })
                          }
                        >
                          {visibleKeys.has(config.provider) ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>

                      {/* Validation and Save Buttons */}
                      <div className="api-key-actions">
                        <button
                          onClick={() => handleValidateKey(config.provider)}
                          className="validate-btn"
                          disabled={!state?.value || state?.isValidating}
                        >
                          {state?.isValidating ? (
                            <>
                              <Loader size={16} className="spinning" />
                              {t('apiKeys.validating', { ns: 'options' })}
                            </>
                          ) : (
                            <>
                              <CheckCircle size={16} />
                              {t('apiKeys.validate', { ns: 'options' })}
                            </>
                          )}
                        </button>

                        {state?.hasChanges && (
                          <button
                            onClick={() => handleSaveIndividualKey(config.provider)}
                            className="save-individual-btn"
                            disabled={state?.isSaving}
                          >
                            {state?.isSaving ? (
                              <>
                                <Loader size={16} className="spinning" />
                                {t('actions.saveIndividual', { ns: 'options' })}
                              </>
                            ) : (
                              <>
                                <Save size={16} />
                                {t('actions.saveIndividual', { ns: 'options' })}
                              </>
                            )}
                          </button>
                        )}

                        {/* Validation Status */}
                        {state?.validationResult && (
                          <span className={`validation-status ${state.validationResult}`}>
                            {state.validationResult === 'valid'
                              ? t('apiKeys.valid', { ns: 'options' })
                              : state.validationError || t('apiKeys.invalid', { ns: 'options' })
                            }
                          </span>
                        )}

                        {/* Save Success Message */}
                        {state?.saveSuccess && (
                          <span className="save-success-message">
                            <CheckCircle size={16} />
                            {t('actions.saveSuccess', { ns: 'options' })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="error-message">
                <AlertCircle size={18} />
                {error}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="options-footer">
        <p>{t('footer.text', { ns: 'options' })}</p>
      </footer>
    </div>
  );
};

// React uygulamasını başlat
const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <OptionsPage />
    </React.StrictMode>
  );
}
