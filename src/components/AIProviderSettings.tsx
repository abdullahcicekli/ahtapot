/**
 * AI Provider Settings Component
 * Key flow per provider: enter key → Test (live request) → Save appears on a
 * passing test → once saved, the model tier select unlocks.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Info, ExternalLink, Save, CheckCircle, Loader, AlertCircle, Bot, DollarSign, FlaskConical } from 'lucide-react';
import { AIProvider, AI_PROVIDER_CONFIGS, AIModelTier } from '@/types/ai';
import { getAIKeys, saveAIKey, validateAIKeyFormat } from '@/utils/aiKeyStorage';
import { testAIKey } from '@/utils/aiKeyTest';
import { getModelForProvider, saveModelForProvider } from '@/utils/aiPreferences';
import { Select } from '@/components/Select';
import './AIProviderSettings.css';

interface AIKeyState {
  savedKey: string;
  value: string;
  isTesting: boolean;
  testPassed: boolean;
  testError?: string;
  isSaving: boolean;
  saveSuccess: boolean;
  validationError?: string;
  model: string;
}

const TIER_ORDER: AIModelTier[] = ['low', 'mid', 'high'];

export const AIProviderSettings: React.FC = () => {
  const { t } = useTranslation(['options', 'common']);
  const [aiKeyStates, setAiKeyStates] = useState<Record<AIProvider, AIKeyState>>({} as Record<AIProvider, AIKeyState>);
  const [visibleKeys, setVisibleKeys] = useState<Set<AIProvider>>(new Set());
  const [expandedInfo, setExpandedInfo] = useState<Set<AIProvider>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadKeys() {
      try {
        const keys = await getAIKeys();
        const initialStates = {} as Record<AIProvider, AIKeyState>;

        for (const provider of Object.values(AIProvider)) {
          const savedKey = keys[provider]?.key || '';
          initialStates[provider] = {
            savedKey,
            value: savedKey,
            isTesting: false,
            testPassed: false,
            isSaving: false,
            saveSuccess: false,
            model: await getModelForProvider(provider),
          };
        }

        setAiKeyStates(initialStates);
      } catch (error) {
        console.error('Error loading AI API keys:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadKeys();
  }, []);

  const patchState = useCallback((provider: AIProvider, patch: Partial<AIKeyState>) => {
    setAiKeyStates((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], ...patch },
    }));
  }, []);

  const handleKeyChange = useCallback(
    (provider: AIProvider, value: string) => {
      const sanitizedValue = value.trim();
      if (sanitizedValue.length > 300) return;

      const validation = validateAIKeyFormat(provider, sanitizedValue);
      patchState(provider, {
        value: sanitizedValue,
        // any edit invalidates a previous test result
        testPassed: false,
        testError: undefined,
        saveSuccess: false,
        validationError:
          sanitizedValue.length > 0 && !validation.valid ? validation.error : undefined,
      });
    },
    [patchState],
  );

  const handleTestKey = useCallback(
    async (provider: AIProvider) => {
      const state = aiKeyStates[provider];
      if (!state?.value || state.validationError) return;

      patchState(provider, { isTesting: true, testError: undefined });
      const result = await testAIKey(provider, state.value);
      patchState(provider, {
        isTesting: false,
        testPassed: result.ok,
        testError: result.ok ? undefined : result.error,
      });
    },
    [aiKeyStates, patchState],
  );

  const handleSaveKey = useCallback(
    async (provider: AIProvider) => {
      const state = aiKeyStates[provider];
      if (!state?.value || !state.testPassed) return;

      patchState(provider, { isSaving: true, saveSuccess: false });
      try {
        await saveAIKey(provider, state.value);
        patchState(provider, {
          isSaving: false,
          saveSuccess: true,
          savedKey: state.value,
        });
        setTimeout(() => patchState(provider, { saveSuccess: false }), 3000);
      } catch (error) {
        console.error('Error saving AI API key:', error);
        patchState(provider, { isSaving: false });
      }
    },
    [aiKeyStates, patchState],
  );

  const handleModelChange = useCallback(
    async (provider: AIProvider, model: string) => {
      patchState(provider, { model });
      try {
        await saveModelForProvider(provider, model);
      } catch (error) {
        console.error('Error saving model preference:', error);
      }
    },
    [patchState],
  );

  const toggleVisibility = useCallback((provider: AIProvider) => {
    setVisibleKeys((prev) => {
      const newSet = new Set(prev);
      newSet.has(provider) ? newSet.delete(provider) : newSet.add(provider);
      return newSet;
    });
  }, []);

  const toggleInfo = useCallback((provider: AIProvider) => {
    setExpandedInfo((prev) => {
      const newSet = new Set(prev);
      newSet.has(provider) ? newSet.delete(provider) : newSet.add(provider);
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
          <Bot size={22} className="ai-providers-icon" />
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
          const isConfigured = Boolean(state?.savedKey);
          const isDirty = Boolean(state && state.value && state.value !== state.savedKey);
          const canTest = isDirty && !state?.validationError && !state?.isTesting;
          const canSave = isDirty && Boolean(state?.testPassed) && !state?.isSaving;

          const sortedModels = [...config.models].sort(
            (a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier),
          );

          return (
            <div key={provider} className="ai-provider-card" data-provider={provider}>
              <div className="ai-provider-header">
                <div className="ai-provider-title-row">
                  <div className="ai-provider-identity">
                    <span className="ai-provider-logo-tile" aria-hidden="true">
                      <img src={config.logo} alt="" loading="lazy" />
                    </span>
                    <div className="ai-provider-info">
                      <h3 className="ai-provider-name">{config.displayName}</h3>
                      <p className="ai-provider-description">
                        {t(`ai.providers.${providerKey}.description`, { ns: 'options' })}
                      </p>
                    </div>
                  </div>
                  <div className="ai-provider-meta">
                    <span className={`key-status ${isConfigured ? 'configured' : 'missing'}`}>
                      {isConfigured
                        ? t('apiKeys.status.configured', { ns: 'options' })
                        : t('apiKeys.status.missing', { ns: 'options' })}
                    </span>
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
              </div>

              {expandedInfo.has(provider) && (
                <div className="ai-info-box">
                  <div className="ai-info-section ai-models-section">
                    <h4>
                      <DollarSign size={16} />
                      {t('ai.models.title', { ns: 'options' })}
                    </h4>
                    <div className="ai-models-list">
                      {sortedModels.map((model) => (
                        <div key={model.id} className="ai-model-item">
                          <span className="ai-model-display-name">
                            {model.displayName}
                            <span className="ai-model-tier">
                              {t(`ai.tier.${model.tier}`, { ns: 'options' })}
                            </span>
                          </span>
                          <span className="ai-model-pricing">{model.pricing}</span>
                        </div>
                      ))}
                    </div>
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

              {state?.testError && (
                <p className="ai-validation-error">
                  <AlertCircle size={14} />
                  {state.testError}
                </p>
              )}

              <div className="ai-key-actions">
                {isDirty && !state?.testPassed && (
                  <button
                    onClick={() => handleTestKey(provider)}
                    className="test-ai-key-btn"
                    disabled={!canTest}
                  >
                    {state?.isTesting ? (
                      <>
                        <Loader size={16} className="spinning" />
                        {t('ai.actions.testing', { ns: 'options' })}
                      </>
                    ) : (
                      <>
                        <FlaskConical size={16} />
                        {t('ai.actions.test', { ns: 'options' })}
                      </>
                    )}
                  </button>
                )}

                {isDirty && state?.testPassed && (
                  <>
                    <span className="test-passed-message">
                      <CheckCircle size={16} />
                      {t('ai.actions.testPassed', { ns: 'options' })}
                    </span>
                    <button
                      onClick={() => handleSaveKey(provider)}
                      className="save-ai-key-btn"
                      disabled={!canSave}
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
                  </>
                )}

                {state?.saveSuccess && (
                  <span className="save-success-message">
                    <CheckCircle size={16} />
                    {t('actions.saveSuccess', { ns: 'options' })}
                  </span>
                )}
              </div>

              <div className={`ai-model-picker ${isConfigured ? '' : 'locked'}`}>
                <span className="ai-model-picker-label">{t('ai.model.label', { ns: 'options' })}</span>
                {isConfigured ? (
                  <Select
                    value={state.model}
                    options={sortedModels.map((model) => ({
                      value: model.id,
                      label: `${model.displayName} — ${t(`ai.tier.${model.tier}`, { ns: 'options' })}`,
                    }))}
                    onChange={(model) => handleModelChange(provider, model)}
                    aria-label={`${config.displayName} model`}
                    className="ai-model-select"
                  />
                ) : (
                  <p className="ai-model-picker-hint">{t('ai.model.locked', { ns: 'options' })}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
