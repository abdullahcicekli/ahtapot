import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { useTranslation } from 'react-i18next';
import { Save, CheckCircle, AlertCircle, Eye, EyeOff, Info, ExternalLink, Settings, Key, Globe, Database, Trash2, Loader, GripVertical, RotateCcw, X, ArrowUpDown, ChevronUp, ChevronDown, Sparkles, Move } from 'lucide-react';
import { APIProvider } from '@/types/ioc';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n/config';
import { APIKeyValidator } from '@/utils/apiValidator';
import { CacheManager, CacheSettings } from '@/utils/cacheManager';
import { getAPIKeys, saveAPIKey } from '@/utils/apiKeyStorage';
import { getProviderOrder, saveProviderOrder, resetProviderOrder } from '@/utils/providerOrderStorage';
import { PROVIDER_TO_SERVICE_NAME } from '@/utils/providerMappings';
import { isProviderEnabled } from '@/config/providerDisplay';
import { AIProviderSettings } from '@/components/AIProviderSettings';
import '@/i18n/config';
import '@/components/AIProviderSettings.css';
import './options.css';

type TabType = 'general' | 'apiKeys';

interface APIKeyConfig {
  provider: APIProvider;
  label: string;
  link: string;
  signupLink: string;
  requiresApiKey?: boolean; // Optional, defaults to true
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
    provider: APIProvider.OTX,
    label: 'OTX AlienVault',
    link: 'https://otx.alienvault.com/api',
    signupLink: 'https://otx.alienvault.com/signup',
  },
  {
    provider: APIProvider.ABUSEIPDB,
    label: 'AbuseIPDB',
    link: 'https://www.abuseipdb.com/account/api',
    signupLink: 'https://www.abuseipdb.com/register',
  },
  {
    provider: APIProvider.MALWAREBAZAAR,
    label: 'MalwareBazaar',
    link: 'https://auth.abuse.ch/user/me',
    signupLink: 'https://auth.abuse.ch/signup',
  },
  {
    provider: APIProvider.SHODAN,
    label: 'Shodan',
    link: 'https://developer.shodan.io/api',
    signupLink: 'https://account.shodan.io/register',
  },
  {
    provider: APIProvider.GREYNOISE,
    label: 'GreyNoise',
    link: 'https://viz.greynoise.io/account/details',
    signupLink: 'https://viz.greynoise.io/signup',
  },
  {
    provider: APIProvider.URLHAUS,
    label: 'URLhaus',
    link: 'https://auth.abuse.ch/user/me',
    signupLink: 'https://auth.abuse.ch/signup',
  },
  {
    provider: APIProvider.PULSEDIVE,
    label: 'Pulsedive',
    link: 'https://pulsedive.com/account/',
    signupLink: 'https://pulsedive.com/register',
  },
  {
    provider: APIProvider.SCAMALYTICS,
    label: 'Scamalytics',
    link: 'https://scamalytics.com/ip/api',
    signupLink: 'https://scamalytics.com/ip/api/pricing',
  },
  {
    provider: APIProvider.ARIN,
    label: 'ARIN WHOIS',
    link: 'https://www.arin.net/resources/registry/whois/',
    signupLink: 'https://www.arin.net/resources/registry/whois/',
    requiresApiKey: false,
  },
];

const OptionsPage: React.FC = () => {
  const { t, i18n } = useTranslation(['options', 'common']);
  
  // Get initial tab from URL
  const getInitialTab = (): TabType => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab') as TabType | null;
    if (tab && (tab === 'general' || tab === 'apiKeys')) {
      return tab;
    }
    return 'general';
  };
  
  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(i18n.language as SupportedLanguage || 'en');
  const [apiKeyStates, setApiKeyStates] = useState<Record<string, APIKeyState>>({});
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [expandedInfo, setExpandedInfo] = useState<Set<string>>(new Set());
  const [showCacheInfo, setShowCacheInfo] = useState(false);
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

  // Provider order modal state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [providerOrder, setProviderOrder] = useState<APIProvider[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Memoize locked providers to avoid repeated filtering
  const lockedProviders = useMemo(() =>
    API_CONFIGS
      .filter(config => config.requiresApiKey === false)
      .map(config => config.provider),
    []
  );

  // Memoize locked configs for modal rendering
  const lockedConfigs = useMemo(() =>
    API_CONFIGS.filter(config => config.requiresApiKey === false),
    []
  );

  // Load settings
  useEffect(() => {
    loadSettings();
    loadCacheSettings();
    loadProviderOrder();

    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const provider = urlParams.get('provider');

    if (provider) {
      // Switch to API Keys tab if provider is specified
      setActiveTab('apiKeys');
      updateURL('apiKeys');

      // Scroll to the provider card after a short delay
      setTimeout(() => {
        scrollToProvider(provider as APIProvider);
      }, 300);
    }

    // Listen for messages from ProviderStatusBadges component
    const messageListener = (message: any) => {
      if (message.type === 'SCROLL_TO_PROVIDER') {
        scrollToProvider(message.provider as APIProvider);
      } else if (message.type === 'SWITCH_TAB_AND_SCROLL') {
        setActiveTab(message.tab);
        setTimeout(() => {
          scrollToProvider(message.provider as APIProvider);
        }, 300);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  // Update URL when tab changes
  const updateURL = useCallback((tab: TabType) => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    // Remove provider param when switching tabs (unless it's apiKeys)
    if (tab !== 'apiKeys') {
      url.searchParams.delete('provider');
    }
    window.history.replaceState({}, '', url.toString());
  }, []);

  // Handle tab change with URL update
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    updateURL(tab);
  }, [updateURL]);

  // Scroll to specific provider card and highlight it
  const scrollToProvider = (provider: APIProvider) => {
    const cardElement = document.querySelector(`[data-provider="${provider}"]`);

    if (cardElement) {
      cardElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      // Add highlight animation
      cardElement.classList.add('highlight-flash');

      // Focus the input
      const input = cardElement.querySelector('input') as HTMLInputElement;
      if (input) {
        setTimeout(() => {
          input.focus();
        }, 600);
      }

      // Remove highlight after animation
      setTimeout(() => {
        cardElement.classList.remove('highlight-flash');
      }, 2000);
    }
  };

  async function loadSettings() {
    try {
      // Load API keys using new storage format
      const apiKeys = await getAPIKeys();
      const result = await chrome.storage.local.get('language');

      // Initialize state for each provider
      const initialStates: Record<string, APIKeyState> = {};
      API_CONFIGS.forEach((config) => {
        const keyData = apiKeys[config.provider];
        initialStates[config.provider] = {
          value: keyData?.key || '',
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
      
      // Notify sidepanel to reload for language change
      try {
        await chrome.runtime.sendMessage({ type: 'LANGUAGE_CHANGED', payload: { language: lang } });
      } catch {
        // Sidepanel might not be open, ignore error
      }
      
      setError(null);
    } catch (err) {
      setError(t('actions.errorMessage', { ns: 'options' }));
      console.error('Error changing language:', err);
    }
  };

  // Handle API key change with sanitization
  const handleKeyChange = useCallback((provider: APIProvider, value: string) => {
    // Sanitize input: trim whitespace and remove any potential XSS characters
    const sanitizedValue = value.trim();

    // Validate length (reasonable API key length: 10-200 characters)
    if (sanitizedValue.length > 200) {
      console.warn('API key too long, truncating to 200 characters');
      return;
    }

    setApiKeyStates((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        value: sanitizedValue,
        hasChanges: sanitizedValue !== (prev[provider]?.value || ''),
        validationResult: null,
        saveSuccess: false,
      },
    }));
  }, []);

  // Validate API key
  const handleValidateKey = useCallback(async (provider: APIProvider) => {
    const state = apiKeyStates[provider];
    if (!state || !state.value) return;

    // Additional validation: check for minimum length
    if (state.value.length < 8) {
      setApiKeyStates((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          validationResult: 'invalid',
          validationError: 'API key too short (minimum 8 characters)',
        },
      }));
      return;
    }

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
  }, [apiKeyStates, t]);

  // Save individual API key
  const handleSaveIndividualKey = useCallback(async (provider: APIProvider) => {
    const state = apiKeyStates[provider];
    if (!state || !state.value) return;

    // Prevent saving empty or too short keys
    if (state.value.length < 8) {
      setError('API key is too short');
      return;
    }

    setApiKeyStates((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        isSaving: true,
        saveSuccess: false,
      },
    }));

    try {
      // Save using new storage format with timestamp
      await saveAPIKey(provider, state.value);

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
  }, [apiKeyStates, t]);

  // Toggle visibility
  const toggleVisibility = useCallback((provider: string) => {
    setVisibleKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(provider)) {
        newSet.delete(provider);
      } else {
        newSet.add(provider);
      }
      return newSet;
    });
  }, []);

  // Toggle info
  const toggleInfo = useCallback((provider: string) => {
    setExpandedInfo((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(provider)) {
        newSet.delete(provider);
      } else {
        newSet.add(provider);
      }
      return newSet;
    });
  }, []);

  // Handle cache settings change
  const handleCacheSettingsChange = useCallback(async (updates: Partial<CacheSettings>) => {
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
  }, [cacheSettings, t]);

  // Clear cache
  const handleClearCache = useCallback(async () => {
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
  }, [t]);

  // Format bytes to human readable
  const formatBytes = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }, []);

  // Format date
  const formatDate = useCallback((dateStr: string | null): string => {
    if (!dateStr) return '-';
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${day}/${month}/${year}`;
  }, []);

  // Load provider order
  const loadProviderOrder = useCallback(async () => {
    try {
      const order = await getProviderOrder();
      // Filter out locked providers using memoized list
      const unlockedOrder = order.filter(provider => !lockedProviders.includes(provider));
      setProviderOrder(unlockedOrder);
    } catch (err) {
      console.error('Error loading provider order:', err);
    }
  }, [lockedProviders]);

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  }, []);

  // Handle drag enter (more stable than dragOver)
  const handleDragEnter = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  }, [draggedIndex]);

  // Handle drag over (needed for drop to work)
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(async () => {
    if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder array
    const newOrder = [...providerOrder];
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dragOverIndex, 0, draggedItem);

    setProviderOrder(newOrder);

    // Save to storage
    try {
      await saveProviderOrder(newOrder);
    } catch (err) {
      setError(t('general.providerOrder.orderSaveError', { ns: 'options' }));
      console.error('Error saving provider order:', err);
    } finally {
      setDraggedIndex(null);
      setDragOverIndex(null);
    }
  }, [draggedIndex, dragOverIndex, providerOrder, t]);

  // Reset provider order
  const handleResetProviderOrder = useCallback(async () => {
    if (!confirm(t('general.providerOrder.resetConfirm', { ns: 'options' }))) {
      return;
    }

    try {
      await resetProviderOrder();
      await loadProviderOrder();
    } catch (err) {
      setError(t('general.providerOrder.orderSaveError', { ns: 'options' }));
      console.error('Error resetting provider order:', err);
    }
  }, [t, loadProviderOrder]);

  // Open modal
  const handleOpenOrderModal = useCallback(() => {
    setIsOrderModalOpen(true);
    // Reset drag state
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  // Close modal
  const handleCloseOrderModal = useCallback(() => {
    setIsOrderModalOpen(false);
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  // Handle ESC key for modal
  useEffect(() => {
    if (!isOrderModalOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseOrderModal();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOrderModalOpen, handleCloseOrderModal]);

  // Move provider up in the list
  const handleMoveUp = useCallback(async (index: number) => {
    if (index === 0) return;

    const newOrder = [...providerOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setProviderOrder(newOrder);

    try {
      await saveProviderOrder(newOrder);
    } catch (err) {
      console.error('Error saving provider order:', err);
    }
  }, [providerOrder]);

  // Move provider down in the list
  const handleMoveDown = useCallback(async (index: number) => {
    if (index === providerOrder.length - 1) return;

    const newOrder = [...providerOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setProviderOrder(newOrder);

    try {
      await saveProviderOrder(newOrder);
    } catch (err) {
      console.error('Error saving provider order:', err);
    }
  }, [providerOrder]);

  // Provider logo mapping
  const PROVIDER_LOGOS: Record<APIProvider, string> = {
    [APIProvider.VIRUSTOTAL]: '/provider-icons/virustotal_logo.png',
    [APIProvider.OTX]: '/provider-icons/alienVaultOtx-logo.png',
    [APIProvider.ABUSEIPDB]: '/provider-icons/abuseipdb-logo.png',
    [APIProvider.MALWAREBAZAAR]: '/provider-icons/abuse-logo.png',
    [APIProvider.ARIN]: '/provider-icons/arin-logo.png',
    [APIProvider.SHODAN]: '/provider-icons/shodan-logo.png',
    [APIProvider.GREYNOISE]: '/provider-icons/greynoise-logo.png',
    [APIProvider.URLHAUS]: '/provider-icons/abuse-logo.png',
    [APIProvider.PULSEDIVE]: '/provider-icons/pulsedive-logo.png',
    [APIProvider.SCAMALYTICS]: '/provider-icons/scamalytics-logo.png',
  };

  // Sort API configs by provider order, with locked providers at the end
  const sortedApiConfigs = React.useMemo(() => {
    if (providerOrder.length === 0) {
      return API_CONFIGS;
    }

    // Filter out disabled providers first
    const enabledConfigs = API_CONFIGS.filter(config => isProviderEnabled(config.provider));
    
    // Separate locked and unlocked providers
    const lockedConfigs = enabledConfigs.filter(config => config.requiresApiKey === false);
    const unlockedConfigs = enabledConfigs.filter(config => config.requiresApiKey !== false);

    // Create a map of provider to its order index
    const orderMap = new Map<APIProvider, number>();
    providerOrder.forEach((provider, index) => {
      orderMap.set(provider, index);
    });

    // Sort unlocked configs based on provider order
    const sortedUnlocked = [...unlockedConfigs].sort((a, b) => {
      const orderA = orderMap.get(a.provider) ?? 999;
      const orderB = orderMap.get(b.provider) ?? 999;
      return orderA - orderB;
    });

    // Return unlocked configs followed by locked configs
    return [...sortedUnlocked, ...lockedConfigs];
  }, [providerOrder]);

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
          onClick={() => handleTabChange('general')}
        >
          <Settings size={18} />
          {t('tabs.general', { ns: 'options' })}
        </button>
        <button
          className={`tab ${activeTab === 'apiKeys' ? 'active' : ''}`}
          onClick={() => handleTabChange('apiKeys')}
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
                <button
                  type="button"
                  onClick={() => setShowCacheInfo(!showCacheInfo)}
                  className={`info-btn ${showCacheInfo ? 'active' : ''}`}
                  aria-label="Cache information"
                  title={t('general.cache.infoTitle', { ns: 'options' })}
                >
                  <Info size={18} />
                </button>
              </div>

              {showCacheInfo && (
                <div className="cache-info-box">
                  <div className="cache-info-section">
                    <h4>{t('general.cache.info.whyTitle', { ns: 'options' })}</h4>
                    <p>{t('general.cache.info.whyDescription', { ns: 'options' })}</p>
                  </div>
                  <div className="cache-info-section">
                    <h4>{t('general.cache.info.benefitsTitle', { ns: 'options' })}</h4>
                    <ul className="cache-info-list">
                      <li>{t('general.cache.info.benefit1', { ns: 'options' })}</li>
                      <li>{t('general.cache.info.benefit2', { ns: 'options' })}</li>
                      <li>{t('general.cache.info.benefit3', { ns: 'options' })}</li>
                      <li>{t('general.cache.info.benefit4', { ns: 'options' })}</li>
                    </ul>
                  </div>
                  <div className="cache-info-section">
                    <h4>{t('general.cache.info.howTitle', { ns: 'options' })}</h4>
                    <p>{t('general.cache.info.howDescription', { ns: 'options' })}</p>
                  </div>
                </div>
              )}

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

            {/* AI Provider Settings - At the top */}
            <AIProviderSettings />

            <div className="api-keys-section">
              <div className="api-keys-header">
                <div>
                  <h2>{t('apiKeys.sectionTitle', { ns: 'options' })}</h2>
                  <p className="section-description">
                    {t('apiKeys.sectionDescription', { ns: 'options' })}
                  </p>
                </div>
                <button
                  onClick={handleOpenOrderModal}
                  className="customize-order-btn"
                  title={t('general.providerOrder.title', { ns: 'options' })}
                >
                  <ArrowUpDown size={18} />
                  {t('general.providerOrder.customizeButton', { ns: 'options' })}
                </button>
              </div>

              <div className="api-keys-list">
                {sortedApiConfigs.map((config) => {
                  const providerKey = config.provider.toLowerCase();
                  const state = apiKeyStates[config.provider];
                  const isLocked = config.requiresApiKey === false;

                  return (
                    <div
                      key={config.provider}
                      className={`api-key-card ${isLocked ? 'locked-provider' : ''}`}
                      data-provider={config.provider}
                    >
                      <div className="api-key-header">
                        <div className="api-key-title-row">
                          <div>
                            <h3>{t(`providers.${providerKey}.label`, { ns: 'options' })}</h3>
                            <p className="api-key-description">
                              {t(`providers.${providerKey}.description`, { ns: 'options' })}
                            </p>
                          </div>
                          {!isLocked && (
                            <button
                              type="button"
                              onClick={() => toggleInfo(config.provider)}
                              className="info-btn"
                              aria-label="API information"
                              title="API limits and features"
                            >
                              <Info size={18} />
                            </button>
                          )}
                        </div>
                      </div>

                      {isLocked ? (
                        <div className="locked-provider-info">
                          <CheckCircle size={18} className="locked-icon" />
                          <p>{t('lockedProvider.message', { ns: 'options' })}</p>
                        </div>
                      ) : (
                        <>
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

                          {/* Special note for MalwareBazaar */}
                          {config.provider === APIProvider.MALWAREBAZAAR && (
                            <div className="api-info-section api-warning-section">
                              <h4>
                                <AlertCircle size={16} />
                                {t('info.importantNote', { ns: 'options' })}
                              </h4>
                              <p className="api-warning-text">
                                {t(`notes.${providerKey}`, { ns: 'options' })}
                              </p>
                            </div>
                          )}

                          {/* Special note for Scamalytics */}
                          {config.provider === APIProvider.SCAMALYTICS && (
                            <div className="api-info-section api-warning-section">
                              <h4>
                                <AlertCircle size={16} />
                                {t('info.importantNote', { ns: 'options' })}
                              </h4>
                              <p className="api-warning-text">
                                {t(`notes.${providerKey}`, { ns: 'options' })}
                              </p>
                            </div>
                          )}
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
                        </>
                      )}
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
        <p>{t('footer.text', { ns: 'options', version: chrome.runtime.getManifest().version })}</p>
      </footer>

      {/* Provider Order Modal */}
      {isOrderModalOpen && (
        <div className="modal-overlay" onClick={handleCloseOrderModal}>
          <div className="modal-container provider-order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-content">
                <div className="modal-header-icon">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h2>{t('general.providerOrder.title', { ns: 'options' })}</h2>
                  <p className="modal-header-subtitle">{t('general.providerOrder.modalDescription', { ns: 'options' })}</p>
                </div>
              </div>
              <button
                onClick={handleCloseOrderModal}
                className="modal-close-btn"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-drag-hint">
              <Move size={16} />
              <span>{t('general.providerOrder.dragHint', { ns: 'options' })}</span>
            </div>

            <div className="modal-provider-list">
              {providerOrder.map((provider, index) => {
                const serviceName = PROVIDER_TO_SERVICE_NAME[provider];
                const isDragging = draggedIndex === index;
                const isDropTarget = dragOverIndex === index && draggedIndex !== index;
                const isFirst = index === 0;
                const isLast = index === providerOrder.length - 1;

                return (
                  <div
                    key={provider}
                    className={`modal-provider-item ${isDragging ? 'dragging' : ''} ${isDropTarget ? 'drop-target' : ''}`}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnter={(e) => handleDragEnter(e, index)}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="modal-drag-handle-wrapper">
                      <GripVertical size={18} className="modal-drag-handle" />
                    </div>
                    <span className="modal-provider-number">{index + 1}</span>
                    <div className="modal-provider-logo-wrapper">
                      <img
                        src={PROVIDER_LOGOS[provider]}
                        alt={serviceName}
                        className="modal-provider-logo"
                      />
                    </div>
                    <span className="modal-provider-name">{serviceName}</span>
                    <div className="modal-provider-actions">
                      <button
                        className={`modal-move-btn ${isFirst ? 'disabled' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveUp(index);
                        }}
                        disabled={isFirst}
                        title="Move up"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        className={`modal-move-btn ${isLast ? 'disabled' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveDown(index);
                        }}
                        disabled={isLast}
                        title="Move down"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Locked providers section */}
              {lockedConfigs.length > 0 && (
                <>
                  <div className="modal-divider">
                    <span>{t('general.providerOrder.lockedProviders', { ns: 'options' })}</span>
                  </div>
                  {lockedConfigs.map((config) => {
                    const serviceName = PROVIDER_TO_SERVICE_NAME[config.provider];
                    return (
                      <div key={config.provider} className="modal-provider-item locked">
                        <div className="modal-locked-icon-wrapper">
                          <CheckCircle size={18} className="modal-locked-icon" />
                        </div>
                        <span className="modal-provider-number locked-number">
                          {providerOrder.length + 1}
                        </span>
                        <div className="modal-provider-logo-wrapper">
                          <img
                            src={PROVIDER_LOGOS[config.provider]}
                            alt={serviceName}
                            className="modal-provider-logo"
                          />
                        </div>
                        <span className="modal-provider-name">{serviceName}</span>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            <div className="modal-actions">
              <button
                onClick={handleResetProviderOrder}
                className="modal-reset-btn"
              >
                <RotateCcw size={16} />
                {t('general.providerOrder.resetOrder', { ns: 'options' })}
              </button>
              <button
                onClick={handleCloseOrderModal}
                className="modal-done-btn"
              >
                <CheckCircle size={16} />
                {t('general.providerOrder.doneButton', { ns: 'options' })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// React uygulamasını başlat
const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(<OptionsPage />);
}
