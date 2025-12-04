/**
 * AI Analysis Section Component
 * Provides UI for selecting AI provider, model and analysis mode
 */

import React, { useState, useEffect, useRef } from 'react';
import { Bot, ChevronDown, Play, Loader, Settings, X, Check } from 'lucide-react';
import { AIProvider, AIAnalysisMode, AI_PROVIDER_CONFIGS } from '@/types/ai';
import { getConfiguredAIProviders } from '@/utils/aiKeyStorage';
import { getAIPreferences, saveAIPreferences, getValidModelForProvider } from '@/utils/aiPreferences';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import './AIAnalysisSection.css';

interface IOCItem {
  type: string;
  value: string;
}

interface AIAnalysisSectionProps {
  onStartAnalysis: (provider: AIProvider, mode: AIAnalysisMode, model: string, selectedIOC?: IOCItem) => void;
  isAnalyzing: boolean;
  hasResults: boolean;
  disabled?: boolean;
  retryInfo?: { attempt: number; maxAttempts: number } | null;
  currentIOCs?: IOCItem[];
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
  currentIOCs = [],
}) => {
  const { t } = useTranslation('sidepanel');
  const [configuredProviders, setConfiguredProviders] = useState<AIProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<AIAnalysisMode>(AIAnalysisMode.SUMMARY);
  const [isLoading, setIsLoading] = useState(true);
  const [showModeInfo, setShowModeInfo] = useState(false);
  const [showProviderMenu, setShowProviderMenu] = useState(false);
  const [analyzingStateIndex, setAnalyzingStateIndex] = useState(0);
  const [selectedIOCIndex, setSelectedIOCIndex] = useState(0);
  
  const providerMenuRef = useRef<HTMLDivElement>(null);
  const modeInfoRef = useRef<HTMLDivElement>(null);
  const iocSelectorRef = useRef<HTMLDivElement>(null);
  const [showIOCSelector, setShowIOCSelector] = useState(false);

  // Reset IOC selection when IOCs change
  useEffect(() => {
    setSelectedIOCIndex(0);
  }, [currentIOCs.length]);

  // Rotate analyzing messages
  useEffect(() => {
    if (!isAnalyzing || retryInfo) {
      setAnalyzingStateIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setAnalyzingStateIndex((prev) => (prev + 1) % ANALYZING_STATES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isAnalyzing, retryInfo]);

  // Load configured AI providers and preferences
  useEffect(() => {
    async function loadProvidersAndPreferences() {
      try {
        const [providers, preferences] = await Promise.all([
          getConfiguredAIProviders(),
          getAIPreferences(),
        ]);
        
        setConfiguredProviders(providers);
        setSelectedMode(preferences.mode);
        
        // Set provider and model from preferences if available
        if (providers.includes(preferences.provider)) {
          setSelectedProvider(preferences.provider);
          setSelectedModel(getValidModelForProvider(preferences.provider, preferences.model));
        } else if (providers.length > 0) {
          // Fallback to first configured provider
          const defaultProvider = providers[0];
          const defaultModel = AI_PROVIDER_CONFIGS[defaultProvider].models[0]?.id || '';
          setSelectedProvider(defaultProvider);
          setSelectedModel(defaultModel);
        }
      } catch (error) {
        console.error('Error loading AI providers:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProvidersAndPreferences();

    // Listen for storage changes
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.aiApiKeys) {
        loadProvidersAndPreferences();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (providerMenuRef.current && !providerMenuRef.current.contains(event.target as Node)) {
        setShowProviderMenu(false);
      }
      if (modeInfoRef.current && !modeInfoRef.current.contains(event.target as Node)) {
        setShowModeInfo(false);
      }
      if (iocSelectorRef.current && !iocSelectorRef.current.contains(event.target as Node)) {
        setShowIOCSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Save preferences when selection changes
  const savePreferences = async (provider: AIProvider, model: string, mode: AIAnalysisMode) => {
    await saveAIPreferences({ provider, model, mode });
  };

  const handleModelSelect = (provider: AIProvider, modelId: string) => {
    setSelectedProvider(provider);
    setSelectedModel(modelId);
    setShowProviderMenu(false);
    savePreferences(provider, modelId, selectedMode);
  };

  const toggleProviderMenu = () => {
    if (!isAnalyzing && !disabled) {
      setShowProviderMenu(!showProviderMenu);
    }
  };

  const handleModeChange = (mode: AIAnalysisMode) => {
    setSelectedMode(mode);
    setShowModeInfo(false);
    if (selectedProvider && selectedModel) {
      savePreferences(selectedProvider, selectedModel, mode);
    }
  };

  const handleStartAnalysis = () => {
    if (selectedProvider && selectedModel && !isAnalyzing && !disabled) {
      const selectedIOC = currentIOCs.length > 0 ? currentIOCs[selectedIOCIndex] : undefined;
      onStartAnalysis(selectedProvider, selectedMode, selectedModel, selectedIOC);
    }
  };

  const openSettings = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/pages/options/index.html?tab=apiKeys&section=ai'),
    });
  };

  const toggleModeInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowModeInfo(!showModeInfo);
  };

  // Get current model display name
  const getCurrentModelDisplay = () => {
    if (!selectedProvider || !selectedModel) return '';
    const config = AI_PROVIDER_CONFIGS[selectedProvider];
    const model = config.models.find(m => m.id === selectedModel);
    return model?.displayName || selectedModel;
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

  // Truncate IOC value for display
  const truncateIOC = (value: string, maxLen: number = 32) => {
    if (value.length <= maxLen) return value;
    return value.substring(0, maxLen - 3) + '...';
  };

  return (
    <div className="ai-section">
      <div className="ai-header">
        <Bot size={16} className="ai-icon" />
        <span className="ai-title">{t('ai.title')}</span>
      </div>

      {/* IOC Selector - only show when multiple IOCs */}
      {currentIOCs.length > 1 && (
        <div className="ai-ioc-selector-wrapper" ref={iocSelectorRef}>
          <button
            className={`ai-ioc-trigger ${showIOCSelector ? 'open' : ''}`}
            onClick={() => !isAnalyzing && !disabled && setShowIOCSelector(!showIOCSelector)}
            disabled={isAnalyzing || disabled}
            title={currentIOCs[selectedIOCIndex]?.value}
          >
            <span className="ai-ioc-type">{currentIOCs[selectedIOCIndex]?.type.toUpperCase()}</span>
            <span className="ai-ioc-value">{truncateIOC(currentIOCs[selectedIOCIndex]?.value || '', 28)}</span>
            <ChevronDown size={14} className={`ai-ioc-arrow ${showIOCSelector ? 'rotated' : ''}`} />
          </button>

          {showIOCSelector && (
            <div className="ai-ioc-dropdown">
              {currentIOCs.map((ioc, index) => (
                <button
                  key={index}
                  className={`ai-ioc-option ${selectedIOCIndex === index ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedIOCIndex(index);
                    setShowIOCSelector(false);
                  }}
                  title={ioc.value}
                >
                  <span className="ai-ioc-type">{ioc.type.toUpperCase()}</span>
                  <span className="ai-ioc-value">{truncateIOC(ioc.value, 32)}</span>
                  {selectedIOCIndex === index && <Check size={12} className="ai-ioc-check" />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="ai-controls">
        <div className="ai-actions">
          {/* Provider & Model Dropdown */}
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
                  <span className="ai-provider-selected-model">
                    {getCurrentModelDisplay()}
                  </span>
                </>
              ) : (
                <span className="ai-provider-placeholder">{t('ai.selectProvider')}</span>
              )}
              <ChevronDown size={14} className={`ai-dropdown-icon ${showProviderMenu ? 'rotated' : ''}`} />
            </button>

            {showProviderMenu && (
              <div className="ai-provider-menu">
                {/* All models from configured providers - flat list */}
                <div className="ai-model-list-flat">
                  {configuredProviders.flatMap((provider) => {
                    const config = AI_PROVIDER_CONFIGS[provider];
                    return config.models.map((model) => {
                      const isSelected = selectedProvider === provider && selectedModel === model.id;
                      return (
                        <button
                          key={`${provider}-${model.id}`}
                          className={`ai-model-flat-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleModelSelect(provider, model.id)}
                        >
                          <img src={config.logo} alt={config.shortName} className="ai-model-logo" />
                          <span className="ai-model-name">{model.displayName}</span>
                          {isSelected && <Check size={14} className="ai-model-check" />}
                        </button>
                      );
                    });
                  })}
                </div>

                {/* Unconfigured Providers - show their models as disabled */}
                {ALL_PROVIDERS.filter(p => !configuredProviders.includes(p)).length > 0 && (
                  <>
                    <div className="ai-provider-divider" />
                    <div className="ai-model-list-flat disabled">
                      {ALL_PROVIDERS.filter(p => !configuredProviders.includes(p)).flatMap((provider) => {
                        const config = AI_PROVIDER_CONFIGS[provider];
                        return config.models.map((model) => (
                          <button
                            key={`${provider}-${model.id}`}
                            className="ai-model-flat-item disabled"
                            disabled
                            title={t('ai.noApiKey')}
                          >
                            <img src={config.logo} alt={config.shortName} className="ai-model-logo" />
                            <span className="ai-model-name">{model.displayName}</span>
                            <span className="ai-model-no-key">{t('ai.noKey')}</span>
                          </button>
                        ));
                      })}
                    </div>
                  </>
                )}

                <div className="ai-provider-divider" />
                <button className="ai-provider-settings" onClick={openSettings}>
                  <Settings size={14} />
                  <span>{t('ai.configureKeys')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Mode Badge */}
          <div className="ai-mode-badge-wrapper" ref={modeInfoRef}>
            <button 
              className={`ai-mode-badge ${selectedMode}`}
              onClick={toggleModeInfo}
              disabled={isAnalyzing || disabled}
              title={t('ai.modeInfo.title')}
            >
              <span>{t(`ai.modes.${selectedMode}`)}</span>
              <ChevronDown size={12} className={`ai-mode-arrow ${showModeInfo ? 'rotated' : ''}`} />
            </button>

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
                      onClick={() => handleModeChange(mode as AIAnalysisMode)}
                    >
                      <div className="ai-mode-info-name">
                        {t(`ai.modes.${mode}`)}
                      </div>
                      <div className="ai-mode-info-meta">
                        <span className="ai-mode-info-words">{info.words}</span>
                        <span className="ai-mode-info-separator">•</span>
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

          {/* Start Button */}
          <button
            className="ai-start-btn"
            onClick={handleStartAnalysis}
            disabled={!selectedProvider || !selectedModel || isAnalyzing || disabled}
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
      </div>
    </div>
  );
};
