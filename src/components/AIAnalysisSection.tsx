/**
 * AI Analysis Section Component
 * Provides UI for selecting AI provider and analysis mode
 */

import React, { useState, useEffect, useRef } from 'react';
import { Bot, ChevronDown, Play, Loader, Settings, Info, X, Check } from 'lucide-react';
import { AIProvider, AIAnalysisMode, AI_PROVIDER_CONFIGS } from '@/types/ai';
import { getConfiguredAIProviders } from '@/utils/aiKeyStorage';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import './AIAnalysisSection.css';

interface AIAnalysisSectionProps {
  onStartAnalysis: (provider: AIProvider, mode: AIAnalysisMode) => void;
  isAnalyzing: boolean;
  hasResults: boolean;
  disabled?: boolean;
  retryInfo?: { attempt: number; maxAttempts: number } | null;
}

// All available providers for the dropdown
const ALL_PROVIDERS = [AIProvider.CLAUDE, AIProvider.GEMINI, AIProvider.OPENAI];

// Mode info configuration
const MODE_INFO = {
  [AIAnalysisMode.SUMMARY]: {
    words: '~200',
    readTime: '10 sec',
    audience: 'L1',
  },
  [AIAnalysisMode.ANALYSIS]: {
    words: '400-600',
    readTime: '1-2 min',
    audience: 'L1/L2',
  },
  [AIAnalysisMode.DETAILED]: {
    words: '800-1200',
    readTime: '3-5 min',
    audience: 'L2/L3 + IR',
  },
};

// Analyzing states for rotating messages
const ANALYZING_STATES = [
  'sending',
  'processing', 
  'thinking',
  'generating',
  'almostDone',
  'finalizing',
] as const;

export const AIAnalysisSection: React.FC<AIAnalysisSectionProps> = ({
  onStartAnalysis,
  isAnalyzing,
  hasResults,
  disabled = false,
  retryInfo = null,
}) => {
  const { t } = useTranslation('sidepanel');
  const [configuredProviders, setConfiguredProviders] = useState<AIProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);
  const [selectedMode, setSelectedMode] = useState<AIAnalysisMode>(AIAnalysisMode.SUMMARY);
  const [isLoading, setIsLoading] = useState(true);
  const [showModeInfo, setShowModeInfo] = useState(false);
  const [showProviderMenu, setShowProviderMenu] = useState(false);
  const [analyzingStateIndex, setAnalyzingStateIndex] = useState(0);
  const providerMenuRef = useRef<HTMLDivElement>(null);

  // Rotate analyzing messages
  useEffect(() => {
    if (!isAnalyzing || retryInfo) {
      setAnalyzingStateIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setAnalyzingStateIndex((prev) => (prev + 1) % ANALYZING_STATES.length);
    }, 3000); // Change message every 3 seconds

    return () => clearInterval(interval);
  }, [isAnalyzing, retryInfo]);

  // Load configured AI providers
  useEffect(() => {
    async function loadProviders() {
      try {
        const providers = await getConfiguredAIProviders();
        setConfiguredProviders(providers);
        if (providers.length > 0 && !selectedProvider) {
          setSelectedProvider(providers[0]);
        }
      } catch (error) {
        console.error('Error loading AI providers:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProviders();

    // Listen for storage changes
    const handleStorageChange = (changes: any) => {
      if (changes.aiApiKeys) {
        loadProviders();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  // Close provider menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (providerMenuRef.current && !providerMenuRef.current.contains(event.target as Node)) {
        setShowProviderMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProviderSelect = (provider: AIProvider) => {
    if (configuredProviders.includes(provider)) {
      setSelectedProvider(provider);
      setShowProviderMenu(false);
    }
  };

  const toggleProviderMenu = () => {
    if (!isAnalyzing && !disabled) {
      setShowProviderMenu(!showProviderMenu);
    }
  };

  const handleModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMode(event.target.value as AIAnalysisMode);
  };

  const handleStartAnalysis = () => {
    if (selectedProvider && !isAnalyzing && !disabled) {
      onStartAnalysis(selectedProvider, selectedMode);
    }
  };

  const openSettings = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/pages/options/index.html?tab=apiKeys&section=ai'),
    });
  };

  const toggleModeInfo = () => {
    setShowModeInfo(!showModeInfo);
  };

  // Don't show if no results yet
  if (!hasResults) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="ai-section ai-section-loading">
        <Loader size={16} className="spinner" />
      </div>
    );
  }

  // Show configuration prompt if no AI providers configured
  if (configuredProviders.length === 0) {
    return (
      <div className="ai-section ai-section-empty">
        <div className="ai-empty-content">
          <Bot size={18} className="ai-empty-icon" />
          <span className="ai-empty-text">{t('ai.noProviders')}</span>
          <button className="ai-configure-btn" onClick={openSettings}>
            <Settings size={14} />
            {t('ai.configure')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-section">
      <div className="ai-header">
        <Bot size={16} className="ai-icon" />
        <span className="ai-title">{t('ai.title')}</span>
      </div>

      <div className="ai-controls">
        {/* Actions Row with Provider Dropdown */}
        <div className="ai-actions">
          {/* Provider Dropdown */}
          <div className="ai-provider-dropdown" ref={providerMenuRef}>
            <button
              className={`ai-provider-trigger ${showProviderMenu ? 'open' : ''}`}
              onClick={toggleProviderMenu}
              disabled={isAnalyzing || disabled}
            >
              {selectedProvider ? (
                <>
                  <img
                    src={AI_PROVIDER_CONFIGS[selectedProvider].logo}
                    alt={AI_PROVIDER_CONFIGS[selectedProvider].shortName}
                    className="ai-provider-logo"
                  />
                  <span className="ai-provider-selected-name">
                    {AI_PROVIDER_CONFIGS[selectedProvider].shortName}
                  </span>
                </>
              ) : (
                <span className="ai-provider-placeholder">{t('ai.selectProvider')}</span>
              )}
              <ChevronDown size={14} className={`ai-dropdown-icon ${showProviderMenu ? 'rotated' : ''}`} />
            </button>

            {showProviderMenu && (
              <div className="ai-provider-menu">
                {/* Configured Providers (Available) */}
                {configuredProviders.length > 0 && (
                  <div className="ai-provider-group">
                    {configuredProviders.map((provider) => {
                      const config = AI_PROVIDER_CONFIGS[provider];
                      const isSelected = selectedProvider === provider;
                      return (
                        <button
                          key={provider}
                          className={`ai-provider-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleProviderSelect(provider)}
                        >
                          <img src={config.logo} alt={config.shortName} className="ai-provider-logo" />
                          <div className="ai-provider-item-info">
                            <span className="ai-provider-item-name">{config.shortName}</span>
                            <span className="ai-provider-item-model">{config.modelName}</span>
                          </div>
                          {isSelected && <Check size={14} className="ai-provider-check" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Unconfigured Providers (Disabled) */}
                {ALL_PROVIDERS.filter(p => !configuredProviders.includes(p)).length > 0 && (
                  <>
                    {configuredProviders.length > 0 && <div className="ai-provider-divider" />}
                    <div className="ai-provider-group disabled">
                      {ALL_PROVIDERS.filter(p => !configuredProviders.includes(p)).map((provider) => {
                        const config = AI_PROVIDER_CONFIGS[provider];
                        return (
                          <button
                            key={provider}
                            className="ai-provider-item disabled"
                            disabled
                            title={t('ai.noApiKey')}
                          >
                            <img src={config.logo} alt={config.shortName} className="ai-provider-logo" />
                            <div className="ai-provider-item-info">
                              <span className="ai-provider-item-name">{config.shortName}</span>
                              <span className="ai-provider-item-model">{config.modelName}</span>
                            </div>
                            <span className="ai-provider-no-key">{t('ai.noKey')}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Settings Link */}
                <div className="ai-provider-divider" />
                <button className="ai-provider-settings" onClick={openSettings}>
                  <Settings size={14} />
                  <span>{t('ai.configureKeys')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Mode Selection */}
          <div className="ai-mode-container">
            <div className="ai-mode-select-wrapper">
              <select
                className="ai-mode-select"
                value={selectedMode}
                onChange={handleModeChange}
                disabled={isAnalyzing || disabled}
              >
                <option value={AIAnalysisMode.SUMMARY}>{t('ai.modes.summary')}</option>
                <option value={AIAnalysisMode.ANALYSIS}>{t('ai.modes.analysis')}</option>
                <option value={AIAnalysisMode.DETAILED}>{t('ai.modes.detailed')}</option>
              </select>
              <ChevronDown size={14} className="ai-select-icon" />
            </div>
            <button 
              className="ai-mode-info-btn"
              onClick={toggleModeInfo}
              title={t('ai.modeInfo.title')}
            >
              <Info size={14} />
            </button>
          </div>

          <button
            className="ai-start-btn"
            onClick={handleStartAnalysis}
            disabled={!selectedProvider || isAnalyzing || disabled}
          >
            {isAnalyzing ? (
              <>
                <Loader size={16} className="spinner" />
                <span>
                  {retryInfo 
                    ? t('ai.errors.retrying', { attempt: retryInfo.attempt, maxAttempts: retryInfo.maxAttempts })
                    : t(`ai.analyzingStates.${ANALYZING_STATES[analyzingStateIndex]}`)
                  }
                </span>
              </>
            ) : (
              <>
                <Play size={16} />
                <span>{t('ai.start')}</span>
              </>
            )}
          </button>
        </div>

        {/* Mode Info Popup */}
        {showModeInfo && (
          <div className="ai-mode-info-popup">
            <div className="ai-mode-info-header">
              <span>{t('ai.modeInfo.title')}</span>
              <button className="ai-mode-info-close" onClick={toggleModeInfo}>
                <X size={14} />
              </button>
            </div>
            <div className="ai-mode-info-content">
              {Object.entries(MODE_INFO).map(([mode, info]) => (
                <div 
                  key={mode} 
                  className={`ai-mode-info-item ${selectedMode === mode ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedMode(mode as AIAnalysisMode);
                    setShowModeInfo(false);
                  }}
                >
                  <div className="ai-mode-info-name">
                    {t(`ai.modes.${mode}`)}
                  </div>
                  <div className="ai-mode-info-meta">
                    <span className="ai-mode-info-words">{info.words} words</span>
                    <span className="ai-mode-info-separator">|</span>
                    <span className="ai-mode-info-time">{info.readTime}</span>
                  </div>
                  <div className="ai-mode-info-desc">
                    {t(`ai.modeInfo.${mode}`)}
                  </div>
                  <div className="ai-mode-info-audience">
                    {info.audience}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
