/**
 * AI Analysis Section Component
 * Provides UI for selecting AI provider and analysis mode
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, ChevronDown, Play, Loader, Settings } from 'lucide-react';
import { AIProvider, AIAnalysisMode, AI_PROVIDER_CONFIGS } from '@/types/ai';
import { getConfiguredAIProviders } from '@/utils/aiKeyStorage';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import './AIAnalysisSection.css';

interface AIAnalysisSectionProps {
  onStartAnalysis: (provider: AIProvider, mode: AIAnalysisMode) => void;
  isAnalyzing: boolean;
  hasResults: boolean;
  disabled?: boolean;
}

export const AIAnalysisSection: React.FC<AIAnalysisSectionProps> = ({
  onStartAnalysis,
  isAnalyzing,
  hasResults,
  disabled = false,
}) => {
  const { t } = useTranslation('sidepanel');
  const [configuredProviders, setConfiguredProviders] = useState<AIProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);
  const [selectedMode, setSelectedMode] = useState<AIAnalysisMode>(AIAnalysisMode.SUMMARY);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleProviderSelect = (provider: AIProvider) => {
    setSelectedProvider(provider);
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
          <Sparkles size={18} className="ai-empty-icon" />
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
        <Sparkles size={16} className="ai-icon" />
        <span className="ai-title">{t('ai.title')}</span>
      </div>

      <div className="ai-controls">
        {/* Provider Selection */}
        <div className="ai-providers">
          {configuredProviders.map((provider) => {
            const config = AI_PROVIDER_CONFIGS[provider];
            const isSelected = selectedProvider === provider;

            return (
              <button
                key={provider}
                className={`ai-provider-btn ${isSelected ? 'selected' : ''}`}
                onClick={() => handleProviderSelect(provider)}
                disabled={isAnalyzing || disabled}
                title={config.displayName}
              >
                <span className="ai-provider-name">{config.displayName}</span>
              </button>
            );
          })}
        </div>

        {/* Mode Selection & Start Button */}
        <div className="ai-actions">
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
            className="ai-start-btn"
            onClick={handleStartAnalysis}
            disabled={!selectedProvider || isAnalyzing || disabled}
          >
            {isAnalyzing ? (
              <>
                <Loader size={16} className="spinner" />
                <span>{t('ai.analyzing')}</span>
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

