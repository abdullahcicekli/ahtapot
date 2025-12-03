/**
 * AI Provider Settings Component
 * Handles API key configuration for AI providers
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Info, ExternalLink, Save, CheckCircle, Loader, AlertCircle, Sparkles, DollarSign } from 'lucide-react';
import { AIProvider, AI_PROVIDER_CONFIGS } from '@/types/ai';
import { getAIKeys, saveAIKey, validateAIKeyFormat, AIKeysStorage } from '@/utils/aiKeyStorage';
import './AIProviderSettings.css';

interface AIKeyState {
  value: string;
  hasChanges: boolean;
  isSaving: boolean;
  saveSuccess: boolean;
  validationError?: string;
}

export const AIProviderSettings: React.FC = () => {
  const { t } = useTranslation(['options', 'common']);
  const [aiKeyStates, setAiKeyStates] = useState<Record<AIProvider, AIKeyState>>({} as Record<AIProvider, AIKeyState>);
  const [visibleKeys, setVisibleKeys] = useState<Set<AIProvider>>(new Set());
  const [expandedInfo, setExpandedInfo] = useState<Set<AIProvider>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Load AI API keys
  useEffect(() => {
    async function loadKeys() {
      try {
        const keys = await getAIKeys();
        const initialStates: Record<AIProvider, AIKeyState> = {} as Record<AIProvider, AIKeyState>;

        Object.values(AIProvider).forEach((provider) => {
          initialStates[provider] = {
            value: keys[provider]?.key || '',
            hasChanges: false,
            isSaving: false,
            saveSuccess: false,
          };
        });

        setAiKeyStates(initialStates);
      } catch (error) {
        console.error('Error loading AI API keys:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadKeys();
  }, []);

  const handleKeyChange = useCallback((provider: AIProvider, value: string) => {
    const sanitizedValue = value.trim();

    if (sanitizedValue.length > 300) {
      return;
    }

    // Validate format
    const validation = validateAIKeyFormat(provider, sanitizedValue);

    setAiKeyStates((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        value: sanitizedValue,
        hasChanges: sanitizedValue !== (prev[provider]?.value || ''),
        saveSuccess: false,
        validationError: sanitizedValue.length > 0 && !validation.valid ? validation.error : undefined,
      },
    }));
  }, []);

  const handleSaveKey = useCallback(async (provider: AIProvider) => {
    const state = aiKeyStates[provider];
    if (!state || !state.value) return;

    // Validate before saving
    const validation = validateAIKeyFormat(provider, state.value);
    if (!validation.valid) {
      setAiKeyStates((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          validationError: validation.error,
        },
      }));
      return;
    }

    setAiKeyStates((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        isSaving: true,
        saveSuccess: false,
      },
    }));

    try {
      await saveAIKey(provider, state.value);

      setAiKeyStates((prev) => ({
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
        setAiKeyStates((prev) => ({
          ...prev,
          [provider]: {
            ...prev[provider],
            saveSuccess: false,
          },
        }));
      }, 3000);
    } catch (error) {
      console.error('Error saving AI API key:', error);
      setAiKeyStates((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          isSaving: false,
        },
      }));
    }
  }, [aiKeyStates]);

  const toggleVisibility = useCallback((provider: AIProvider) => {
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

  const toggleInfo = useCallback((provider: AIProvider) => {
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

  if (isLoading) {
    return (
      <div className="ai-settings-loading">
        <Loader size={20} className="spinning" />
        <span>{t('common:loading')}</span>
      </div>
    );
  }

  return (
    <div className="ai-providers-section">
      <div className="ai-providers-header">
        <div className="ai-providers-title">
          <Sparkles size={20} className="ai-providers-icon" />
          <div>
            <h2>{t('ai.sectionTitle', { ns: 'options' })}</h2>
            <p className="section-description">{t('ai.sectionDescription', { ns: 'options' })}</p>
          </div>
        </div>
      </div>

      <div className="ai-providers-list">
        {Object.values(AIProvider).map((provider) => {
          const config = AI_PROVIDER_CONFIGS[provider];
          const state = aiKeyStates[provider];
          const providerKey = provider.toLowerCase();

          return (
            <div key={provider} className="ai-provider-card" data-provider={provider}>
              <div className="ai-provider-header">
                <div className="ai-provider-title-row">
                  <div className="ai-provider-info">
                    <h3 className="ai-provider-name">{config.displayName}</h3>
                    <p className="ai-provider-description">
                      {t(`ai.providers.${providerKey}.description`, { ns: 'options' })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleInfo(provider)}
                    className={`info-btn ${expandedInfo.has(provider) ? 'active' : ''}`}
                    aria-label="API information"
                    title="API info and pricing"
                  >
                    <Info size={18} />
                  </button>
                </div>
              </div>

              {expandedInfo.has(provider) && (
                <div className="ai-info-box">
                  {/* Pricing Info */}
                  <div className="ai-info-section ai-pricing-section">
                    <h4>
                      <DollarSign size={16} />
                      {t('ai.pricing.title', { ns: 'options' })}
                    </h4>
                    <div className="ai-pricing-grid">
                      <div className="ai-pricing-item">
                        <span className="ai-pricing-label">{t('ai.pricing.input', { ns: 'options' })}</span>
                        <span className="ai-pricing-value">{config.pricingInfo.input}</span>
                      </div>
                      <div className="ai-pricing-item">
                        <span className="ai-pricing-label">{t('ai.pricing.output', { ns: 'options' })}</span>
                        <span className="ai-pricing-value">{config.pricingInfo.output}</span>
                      </div>
                    </div>
                    {config.pricingInfo.note && (
                      <p className="ai-pricing-note">
                        <AlertCircle size={14} />
                        {config.pricingInfo.note}
                      </p>
                    )}
                    <a
                      href={config.pricingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ai-pricing-link"
                    >
                      {t('ai.pricing.viewMore', { ns: 'options' })}
                      <ExternalLink size={12} />
                    </a>
                  </div>

                  {/* How to get API key */}
                  <div className="ai-info-section">
                    <h4>{t('ai.howTo.title', { ns: 'options' })}</h4>
                    <ol className="ai-steps-list">
                      <li>
                        <a href={config.signupUrl} target="_blank" rel="noopener noreferrer">
                          {t('ai.howTo.signup', { ns: 'options' })}
                          <ExternalLink size={14} className="external-icon" />
                        </a>
                      </li>
                      <li>{t(`ai.providers.${providerKey}.step2`, { ns: 'options' })}</li>
                      <li>
                        <a href={config.apiKeyUrl} target="_blank" rel="noopener noreferrer">
                          {t('ai.howTo.getKey', { ns: 'options' })}
                          <ExternalLink size={14} className="external-icon" />
                        </a>
                      </li>
                      <li>{t('ai.howTo.paste', { ns: 'options' })}</li>
                    </ol>
                  </div>

                  {/* Model Info */}
                  <div className="ai-info-section">
                    <h4>{t('ai.model.title', { ns: 'options' })}</h4>
                    <p className="ai-model-name">
                      <code>{config.modelName}</code>
                    </p>
                  </div>
                </div>
              )}

              <div className="ai-key-input-wrapper">
                <input
                  type={visibleKeys.has(provider) ? 'text' : 'password'}
                  placeholder={t(`ai.providers.${providerKey}.placeholder`, { ns: 'options' })}
                  value={state?.value || ''}
                  onChange={(e) => handleKeyChange(provider, e.target.value)}
                  className={`ai-key-input ${state?.validationError ? 'invalid' : ''}`}
                  aria-label={`${config.displayName} API key`}
                />
                <button
                  type="button"
                  onClick={() => toggleVisibility(provider)}
                  className="toggle-visibility-btn"
                  aria-label={visibleKeys.has(provider) ? 'Hide key' : 'Show key'}
                >
                  {visibleKeys.has(provider) ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {state?.validationError && (
                <p className="ai-validation-error">
                  <AlertCircle size={14} />
                  {state.validationError}
                </p>
              )}

              <div className="ai-key-actions">
                {state?.hasChanges && (
                  <button
                    onClick={() => handleSaveKey(provider)}
                    className="save-ai-key-btn"
                    disabled={state?.isSaving || !!state?.validationError}
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
  );
};

