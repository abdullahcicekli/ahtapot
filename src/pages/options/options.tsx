import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { useTranslation } from 'react-i18next';
import { Save, CheckCircle, AlertCircle, Eye, EyeOff, Info, ExternalLink, Settings, Key, Globe } from 'lucide-react';
import { APIProvider } from '@/types/ioc';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n/config';
import '@/i18n/config';
import './options.css';

type TabType = 'general' | 'apiKeys';

interface APIKeyConfig {
  provider: APIProvider;
  label: string;
  link: string;
  signupLink: string;
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
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [expandedInfo, setExpandedInfo] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load settings
  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const result = await chrome.storage.local.get(['apiKeys', 'language']);
      setApiKeys(result.apiKeys || {});
      if (result.language) {
        setCurrentLanguage(result.language);
        i18n.changeLanguage(result.language);
      }
    } catch (err) {
      setError(t('actions.errorLoading', { ns: 'options' }));
      console.error('Error loading settings:', err);
    }
  }

  // Handle language change
  const handleLanguageChange = async (lang: SupportedLanguage) => {
    try {
      setCurrentLanguage(lang);
      await i18n.changeLanguage(lang);
      await chrome.storage.local.set({ language: lang });
      setSaved(true);
      setError(null);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(t('actions.errorMessage', { ns: 'options' }));
      console.error('Error changing language:', err);
    }
  };

  // Handle API key change
  const handleKeyChange = (provider: APIProvider, value: string) => {
    setApiKeys((prev) => ({
      ...prev,
      [provider]: value,
    }));
    setSaved(false);
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

  // Save API keys
  const handleSave = async () => {
    try {
      await chrome.storage.local.set({ apiKeys });
      setSaved(true);
      setError(null);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(t('actions.errorMessage', { ns: 'options' }));
      console.error('Error saving API keys:', err);
    }
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
                          value={apiKeys[config.provider] || ''}
                          onChange={(e) => handleKeyChange(config.provider, e.target.value)}
                          className="api-key-input"
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
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="actions-section">
              <button onClick={handleSave} className="save-btn">
                <Save size={18} />
                {t('actions.save', { ns: 'options' })}
              </button>

              {saved && (
                <div className="success-message">
                  <CheckCircle size={18} />
                  {t('actions.successMessage', { ns: 'options' })}
                </div>
              )}

              {error && (
                <div className="error-message">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}
            </div>
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
