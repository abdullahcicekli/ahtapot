import React, { useState, useEffect, useRef } from 'react';
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
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from 'lucide-react';
import { DetectedIOC, IOCAnalysisResult, APIProvider, IOCType } from '@/types/ioc';
import { AIProvider, AIAnalysisMode, AIAnalysisResult } from '@/types/ai';
import { detectIOCs, getIOCTypeLabel } from '@/utils/ioc-detector';
import { MessageType } from '@/types/messages';
import { ProviderSlider } from '@/components/ProviderSlider';
import { VirusTotalResultCard } from '@/components/results/VirusTotalResultCard';
import { OTXResultCard } from '@/components/results/OTXResultCard';
import { AbuseIPDBResultCard } from '@/components/results/AbuseIPDBResultCard';
import { MalwareBazaarResultCard } from '@/components/results/MalwareBazaarResultCard';
import { ARINResultCard } from '@/components/results/ARINResultCard';
import { ShodanResultCard } from '@/components/results/ShodanResultCard';
import { GreyNoiseResultCard } from '@/components/results/GreyNoiseResultCard';
import { URLhausResultCard } from '@/components/results/URLhausResultCard';
import { PulsediveResultCard } from '@/components/results/PulsediveResultCard';
import { ScamalyticsResultCard } from '@/components/results/ScamalyticsResultCard';
import { RateLimitConfirmCard } from '@/components/results/RateLimitConfirmCard';
import { ErrorResultCard, isErrorResult } from '@/components/results/ErrorResultCard';
import { AIAnalysisSection } from '@/components/AIAnalysisSection';
import { AIStructuredResultCard } from '@/components/results/AIStructuredResultCard';
import { getCachedAIResult, cacheAIResult, clearCachedAIResult } from '@/utils/aiResultCache';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import { getProviderOrder, sortResultsByProviderOrder } from '@/utils/providerOrderStorage';
import { PROVIDER_TO_SERVICE_NAME } from '@/utils/providerMappings';
import { createAIService } from '@/services/ai';
import { getAIKeyValue } from '@/utils/aiKeyStorage';
import '@/i18n/config';
import '@/components/results/ResultCard.css';
import '@/components/AIAnalysisSection.css';
import '@/components/results/AIStructuredResultCard.css';
import './sidepanel.css';

// Provider support mapping - mirrors backend service capabilities
const PROVIDER_SUPPORT: Record<string, IOCType[]> = {
  'AbuseIPDB': [IOCType.IPV4, IOCType.IPV6],
  'VirusTotal': [IOCType.IPV4, IOCType.IPV6, IOCType.DOMAIN, IOCType.URL, IOCType.MD5, IOCType.SHA1, IOCType.SHA256],
  'OTX AlienVault': [IOCType.IPV4, IOCType.IPV6, IOCType.DOMAIN, IOCType.URL, IOCType.MD5, IOCType.SHA1, IOCType.SHA256, IOCType.CVE],
  'MalwareBazaar': [IOCType.MD5, IOCType.SHA1, IOCType.SHA256],
  'ARIN': [IOCType.IPV4, IOCType.IPV6],
  'Shodan': [IOCType.IPV4, IOCType.IPV6, IOCType.DOMAIN],
  'GreyNoise': [IOCType.IPV4],
  'URLhaus': [IOCType.URL, IOCType.DOMAIN, IOCType.IPV4, IOCType.IPV6, IOCType.MD5, IOCType.SHA256],
  'Pulsedive': [IOCType.IPV4, IOCType.IPV6, IOCType.DOMAIN, IOCType.URL, IOCType.MD5, IOCType.SHA1, IOCType.SHA256],
  'Scamalytics': [IOCType.IPV4, IOCType.IPV6],
};

// Get providers that support a specific IOC type
const getSupportingProviders = (iocType: IOCType): string[] => {
  return Object.entries(PROVIDER_SUPPORT)
    .filter(([_, types]) => types.includes(iocType))
    .map(([provider]) => provider);
};

const SidePanel: React.FC = () => {
  const { t, language } = useTranslation('sidepanel');
  const tCommon = useTranslation('common').t;

  const [inputText, setInputText] = useState('');
  const [detectedIOCs, setDetectedIOCs] = useState<DetectedIOC[]>([]);
  const [results, setResults] = useState<IOCAnalysisResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasApiKeys, setHasApiKeys] = useState<boolean | null>(null);
  const [activeProviderTab, setActiveProviderTab] = useState<string>('');
  const [activeIOCTab, setActiveIOCTab] = useState<string>('');
  const [pendingRateLimitProviders, setPendingRateLimitProviders] = useState<Set<'greynoise' | 'shodan'>>(new Set());
  const [currentIOCs, setCurrentIOCs] = useState<DetectedIOC[]>([]);
  const [providerOrder, setProviderOrder] = useState<APIProvider[]>([]);

  // AI Analysis state
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [isProviderResultsExpanded, setIsProviderResultsExpanded] = useState(true);
  const [isAiResultCached, setIsAiResultCached] = useState(false);
  const [aiRetryInfo, setAiRetryInfo] = useState<{ attempt: number; maxAttempts: number } | null>(null);
  const [lastAiQuery, setLastAiQuery] = useState<{
    provider: AIProvider;
    mode: AIAnalysisMode;
    model: string;
    iocValue: string;
  } | null>(null);

  // IOC tabs drag-to-scroll
  const iocTabsRef = useRef<HTMLDivElement>(null);
  const [isIOCTabsDragging, setIsIOCTabsDragging] = useState(false);
  const [iocTabsStartX, setIOCTabsStartX] = useState(0);
  const [iocTabsScrollLeft, setIOCTabsScrollLeft] = useState(0);

  // Helper function to truncate IOC value for tab display
  const truncateIOC = (value: string, maxLength: number = 20): string => {
    if (value.length <= maxLength) return value;
    return value.substring(0, maxLength) + '...';
  };

  // Load provider order
  useEffect(() => {
    async function loadOrder() {
      try {
        const order = await getProviderOrder();
        setProviderOrder(order);
      } catch (error) {
        console.error('[Sidepanel] Error loading provider order:', error);
      }
    }
    loadOrder();
  }, []);

  useEffect(() => {
    checkAPIKeys();

    const handleStorageChange = (changes: any) => {
      if (changes.apiKeys) {
        checkAPIKeys();
      }
      // Reload sidepanel when language changes (fallback if message doesn't arrive)
      if (changes.language) {
        window.location.reload();
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
      
      // Reload sidepanel when language changes
      if (message.type === 'LANGUAGE_CHANGED') {
        window.location.reload();
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

  const handleAnalyze = async (text?: string, providedIOCs?: DetectedIOC[], excludeProviders: Set<APIProvider> = new Set()) => {
    const textToAnalyze = text || inputText;
    const iocs = providedIOCs || detectIOCs(textToAnalyze);

    if (iocs.length === 0) {
      return;
    }

    setDetectedIOCs(iocs);
    setCurrentIOCs(iocs);

    // Reset AI results when starting new analysis
    setAiResult(null);
    setIsProviderResultsExpanded(true);

    if (hasApiKeys === false) {
      return;
    }

    // Check which rate-limited providers are configured
    const ipv4IOCs = iocs.filter(ioc => ioc.type === IOCType.IPV4);
    const pendingProviders = new Set<'greynoise' | 'shodan'>();

    if (ipv4IOCs.length > 0) {
      try {
        const result = await chrome.storage.local.get('apiKeys');
        const apiKeys = result.apiKeys || {};

        // Check if GreyNoise is configured and not excluded
        const hasGreyNoise = apiKeys['greynoise'] &&
          (typeof apiKeys['greynoise'] === 'string' ? apiKeys['greynoise'].trim() !== '' : apiKeys['greynoise']?.key?.trim() !== '');

        // Check if Shodan is configured and not excluded
        const hasShodan = apiKeys['shodan'] &&
          (typeof apiKeys['shodan'] === 'string' ? apiKeys['shodan'].trim() !== '' : apiKeys['shodan']?.key?.trim() !== '');

        if (hasGreyNoise && !excludeProviders.has(APIProvider.GREYNOISE)) {
          pendingProviders.add('greynoise');
        }
        if (hasShodan && !excludeProviders.has(APIProvider.SHODAN)) {
          pendingProviders.add('shodan');
        }

        setPendingRateLimitProviders(pendingProviders);
      } catch (error) {
        console.error('[Sidepanel] Error checking API keys for rate limit:', error);
      }
    }

    // Proceed with analysis (excluding rate-limited providers for now)
    setLoading(true);
    setResults([]);
    setActiveProviderTab(''); // Reset active tab when starting new analysis
    setActiveIOCTab(''); // Reset IOC tab when starting new analysis

    // Convert pending providers to APIProvider enum
    const pendingProviderEnums: APIProvider[] = [];
    if (pendingProviders.has('greynoise')) {
      pendingProviderEnums.push(APIProvider.GREYNOISE);
    }
    if (pendingProviders.has('shodan')) {
      pendingProviderEnums.push(APIProvider.SHODAN);
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: MessageType.ANALYZE_IOC,
        payload: {
          iocs,
          excludeProviders: Array.from(excludeProviders).concat(pendingProviderEnums)
        },
      });

      if (response && response.success) {
        const responseResults = response.results || [];

        // Get fresh provider order from storage (state may not be updated yet)
        const currentProviderOrder = await getProviderOrder();
        setProviderOrder(currentProviderOrder);

        // Sort results by custom provider order
        const sortedResults = sortResultsByProviderOrder<IOCAnalysisResult>(responseResults, currentProviderOrder);
        setResults(sortedResults);

        // Get unique providers that have results
        const providersWithResults = Array.from(new Set(sortedResults.map(r => r.source)));
        
        // Find the first provider in user's order that has results
        if (providersWithResults.length > 0 && currentProviderOrder.length > 0) {
          // Sort providers with results by user's custom order
          const sortedProviders = [...providersWithResults].sort((a, b) => {
            const indexA = currentProviderOrder.findIndex(p => 
              PROVIDER_TO_SERVICE_NAME[p] === a
            );
            const indexB = currentProviderOrder.findIndex(p => 
              PROVIDER_TO_SERVICE_NAME[p] === b
            );
            // If not found, put at end
            const orderA = indexA === -1 ? 999 : indexA;
            const orderB = indexB === -1 ? 999 : indexB;
            return orderA - orderB;
          });
          
          // Set first provider in order as active
          const firstProvider = sortedProviders[0];
          setActiveProviderTab(firstProvider);
          
          // Set first IOC of that provider as active
          const firstProviderResult = sortedResults.find(r => r.source === firstProvider);
          if (firstProviderResult) {
            setActiveIOCTab(firstProviderResult.ioc.value);
          }
        } else if (sortedResults.length > 0) {
          // Fallback if providerOrder is not loaded yet
          setActiveProviderTab(sortedResults[0].source);
          setActiveIOCTab(sortedResults[0].ioc.value);
        }
      }
    } catch (error) {
      console.error('[Sidepanel] Error analyzing IOCs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRateLimitConfirm = async (provider: 'greynoise' | 'shodan') => {
    // Remove this provider from pending
    const newPending = new Set(pendingRateLimitProviders);
    newPending.delete(provider);
    setPendingRateLimitProviders(newPending);

    // Analyze with this specific provider only
    setLoading(true);

    try {
      const providerEnum = provider === 'greynoise' ? APIProvider.GREYNOISE : APIProvider.SHODAN;

      const response = await chrome.runtime.sendMessage({
        type: MessageType.ANALYZE_IOC,
        payload: {
          iocs: currentIOCs,
          includeProviders: [providerEnum] // Only analyze with this provider
        },
      });

      if (response && response.success) {
        const responseResults = response.results || [];

        // Add new results to existing results and sort
        const combinedResults = [...results, ...responseResults];
        const sortedResults = sortResultsByProviderOrder<IOCAnalysisResult>(combinedResults, providerOrder);
        setResults(sortedResults);
      }
    } catch (error) {
      console.error(`[Sidepanel] Error analyzing with ${provider}:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Handle AI Analysis with caching
  const handleAiAnalysis = async (
    provider: AIProvider, 
    mode: AIAnalysisMode, 
    model: string, 
    selectedIOC?: { type: string; value: string },
    forceRefresh: boolean = false
  ) => {
    if (results.length === 0) return;

    const MAX_RETRIES = 3;

    // Get IOC value for cache key - use selected IOC or first available
    const targetIOC = selectedIOC || currentIOCs[0];
    const iocValue = targetIOC?.value || '';
    
    // Check cache first (unless force refresh)
    if (!forceRefresh && iocValue) {
      const cachedResult = await getCachedAIResult(provider, iocValue, mode, language);
      if (cachedResult) {
        setAiResult(cachedResult);
        setIsAiResultCached(true);
        setLastAiQuery({ provider, mode, model, iocValue });
        setIsProviderResultsExpanded(false);
        return;
      }
    }

    setIsAiAnalyzing(true);
    setIsAiResultCached(false);
    setAiRetryInfo(null);
    setAiResult(null); // Clear previous result/error when starting new analysis

    try {
      // Get the API key for the selected provider
      const apiKey = await getAIKeyValue(provider);

      if (!apiKey) {
        setAiResult({
          provider,
          mode,
          content: '',
          timestamp: Date.now(),
          error: t('ai.errors.noApiKey'),
        });
        return;
      }

      // Filter results for the selected IOC only
      const filteredResults = targetIOC 
        ? results.filter(r => r.ioc.value === targetIOC.value)
        : results;

      // Create AI service with selected model and analyze with current language
      const aiService = createAIService(provider, apiKey, model);
      const iocList = targetIOC ? [{ type: targetIOC.type, value: targetIOC.value }] : currentIOCs.map(ioc => ({ type: ioc.type, value: ioc.value }));

      let result: AIAnalysisResult | null = null;

      // Retry loop for invalid JSON responses
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        result = await aiService.analyze(mode, iocList, filteredResults, language);

        // Check if the response has an INVALID_JSON error
        if (result.error && result.error.includes('INVALID_JSON')) {
          if (attempt < MAX_RETRIES) {
            // Show retry info to user
            setAiRetryInfo({ attempt, maxAttempts: MAX_RETRIES });
            console.log(`[Sidepanel] AI response invalid, retrying (${attempt}/${MAX_RETRIES})...`);
            // Small delay before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          } else {
            // Max retries reached
            result = {
              provider,
              mode,
              content: '',
              timestamp: Date.now(),
              error: t('ai.errors.maxRetriesReached', { maxAttempts: MAX_RETRIES }),
            };
            break;
          }
        }

        // Success or other error - break the loop
        break;
      }

      setAiRetryInfo(null);
      
      if (result) {
        setAiResult(result);
        setLastAiQuery({ provider, mode, model, iocValue });

        // Cache the result if successful
        if (!result.error && iocValue) {
          await cacheAIResult(provider, iocValue, mode, language, result);
        }

        // Collapse provider results when AI result comes in
        if (!result.error) {
          setIsProviderResultsExpanded(false);
        }
      }
    } catch (error) {
      console.error('[Sidepanel] Error during AI analysis:', error);
      setAiRetryInfo(null);
      setAiResult({
        provider,
        mode,
        content: '',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : t('ai.errors.unknown'),
      });
    } finally {
      setIsAiAnalyzing(false);
      setAiRetryInfo(null);
    }
  };

  // Handle re-query (force refresh)
  const handleAiRequery = async () => {
    if (!lastAiQuery) return;
    
    // Clear the cached result first
    await clearCachedAIResult(
      lastAiQuery.provider,
      lastAiQuery.iocValue,
      lastAiQuery.mode,
      language
    );
    
    // Find the IOC from the last query
    const targetIOC = currentIOCs.find(ioc => ioc.value === lastAiQuery.iocValue) || currentIOCs[0];
    
    // Re-run analysis with force refresh
    await handleAiAnalysis(lastAiQuery.provider, lastAiQuery.mode, lastAiQuery.model, targetIOC, true);
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
      <a
        className="outpost-banner"
        href="https://outpost.binalyze.ai/en"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="outpost-banner-text">Powered by</span>
        <img
          src="/icons/outpost-logo.svg"
          alt={t('outpostBanner.logoAlt')}
          className="outpost-banner-logo"
        />
        <span className="outpost-banner-divider">|</span>
        <span className="outpost-banner-brand">Binalyze</span>
        <ExternalLink size={11} className="outpost-banner-icon" />
      </a>

      <header className="sidepanel-header">
        <div className="header-title">
          <img
            src="/icons/mark.svg"
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

        <div className="search-section">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <textarea
              id="ioc-input"
              placeholder={t('input.placeholder')}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                // Auto-detect IOCs on input change
                const iocs = detectIOCs(e.target.value);
                setDetectedIOCs(iocs);
              }}
              onKeyDown={(e) => {
                // Shift+Enter: new line, Enter alone: search
                if (e.key === 'Enter' && !e.shiftKey && detectedIOCs.length > 0 && !loading && hasApiKeys !== false) {
                  e.preventDefault();
                  handleAnalyze();
                }
              }}
              className="search-input"
              rows={1}
            />
            <button
              onClick={() => handleAnalyze()}
              className={`analyze-btn-compact ${inputText.trim() ? 'has-input' : ''}`}
              disabled={detectedIOCs.length === 0 || loading || hasApiKeys === false}
              title={t('input.analyzeButton')}
            >
              {loading ? (
                <Loader size={20} className="spinner" />
              ) : (
                <TrendingUp size={20} />
              )}
            </button>
          </div>
          <div className="search-hint">
            <span><Lightbulb size={14} /> {t('input.multipleHint')}</span>
            {detectedIOCs.length > 0 && (
              <span className="detected-count">{t('input.detectedCount', { count: detectedIOCs.length })}</span>
            )}
          </div>
        </div>

        {/* AI Analysis Section - Show after results are loaded */}
        <AIAnalysisSection
          onStartAnalysis={handleAiAnalysis}
          isAnalyzing={isAiAnalyzing}
          hasResults={results.length > 0}
          disabled={loading}
          retryInfo={aiRetryInfo}
          currentIOCs={currentIOCs}
        />

        {/* AI Result */}
        {aiResult && (
          <AIStructuredResultCard 
            result={aiResult} 
            defaultExpanded={true}
            isCached={isAiResultCached}
            onRequery={handleAiRequery}
          />
        )}

         {loading && (
          <div className="loading-spinner-container">
            <img
              src="/icons/mark.svg"
              alt="Loading"
              className="ahtapot-spinner"
            />
            <p className="loading-text">{t('loading.analyzing')}</p>
          </div>
        )}

        {detectedIOCs.length > 0 && results.length === 0 && !loading && (
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
            {/* Collapsible header for provider results when AI result exists */}
            <div 
              className={`section-title-wrapper ${aiResult ? 'collapsible' : ''}`}
              onClick={() => aiResult && setIsProviderResultsExpanded(!isProviderResultsExpanded)}
            >
              <h2 className="section-title">{t('results.title')}</h2>
              {aiResult && (
                <button className="collapse-btn">
                  {isProviderResultsExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              )}
            </div>

            {/* IOC Tabs - Above provider slider */}
            {isProviderResultsExpanded && (() => {
              const allUniqueIOCs = Array.from(new Set(results.map(r => r.ioc.value)));
              const hasMultipleIOCs = allUniqueIOCs.length > 1;
              
              // Set default active IOC if not set
              const currentActiveIOC = activeIOCTab && allUniqueIOCs.includes(activeIOCTab)
                ? activeIOCTab
                : allUniqueIOCs[0] || '';
              
              // Auto-set active IOC tab if needed
              if (!activeIOCTab && allUniqueIOCs.length > 0) {
                setTimeout(() => setActiveIOCTab(allUniqueIOCs[0]), 0);
              }

              const handleIOCTabsMouseDown = (e: React.MouseEvent) => {
                if (!iocTabsRef.current) return;
                setIsIOCTabsDragging(true);
                setIOCTabsStartX(e.pageX - iocTabsRef.current.offsetLeft);
                setIOCTabsScrollLeft(iocTabsRef.current.scrollLeft);
              };

              const handleIOCTabsMouseUp = () => {
                setIsIOCTabsDragging(false);
              };

              const handleIOCTabsMouseMove = (e: React.MouseEvent) => {
                if (!isIOCTabsDragging || !iocTabsRef.current) return;
                e.preventDefault();
                const x = e.pageX - iocTabsRef.current.offsetLeft;
                const walk = (x - iocTabsStartX) * 1.5;
                iocTabsRef.current.scrollLeft = iocTabsScrollLeft - walk;
              };

              const handleIOCTabsMouseLeave = () => {
                setIsIOCTabsDragging(false);
              };

              if (!hasMultipleIOCs) return null;

              return (
                <div 
                  className={`ioc-tabs-container global-ioc-tabs ${isIOCTabsDragging ? 'dragging' : ''}`}
                  ref={iocTabsRef}
                  onMouseDown={handleIOCTabsMouseDown}
                  onMouseUp={handleIOCTabsMouseUp}
                  onMouseMove={handleIOCTabsMouseMove}
                  onMouseLeave={handleIOCTabsMouseLeave}
                >
                  {allUniqueIOCs.map((iocValue) => (
                    <button
                      key={iocValue}
                      className={`ioc-tab ${currentActiveIOC === iocValue ? 'active' : ''}`}
                      onClick={() => {
                        if (!isIOCTabsDragging) {
                          setActiveIOCTab(iocValue);
                          // Reset provider tab when IOC changes
                          setActiveProviderTab('');
                        }
                      }}
                      title={iocValue}
                    >
                      {truncateIOC(iocValue)}
                    </button>
                  ))}
                </div>
              );
            })()}

            {/* Provider Slider - Inside results section, filtered by active IOC */}
            {isProviderResultsExpanded && (
              <ProviderSlider
                activeProvider={activeProviderTab}
                onProviderClick={(providerName) => {
                  setActiveProviderTab(providerName);
                }}
                visibleProviders={(() => {
                  // Get unique IOCs
                  const allUniqueIOCs = Array.from(new Set(results.map(r => r.ioc.value)));
                  const currentActiveIOC = activeIOCTab && allUniqueIOCs.includes(activeIOCTab)
                    ? activeIOCTab
                    : allUniqueIOCs[0] || '';
                  
                  // Filter results by active IOC
                  const iocResults = results.filter(r => r.ioc.value === currentActiveIOC);
                  
                  // Get providers from filtered results
                  const resultProviders = Array.from(new Set(iocResults.map(r => r.source)));
                  
                  // Add pending rate-limited providers to visible list (only for IPv4)
                  const activeIOCType = currentIOCs.find(ioc => ioc.value === currentActiveIOC)?.type;
                  if (activeIOCType === IOCType.IPV4) {
                    if (pendingRateLimitProviders.has('greynoise') && !resultProviders.includes('GreyNoise')) {
                      resultProviders.push('GreyNoise');
                    }
                    if (pendingRateLimitProviders.has('shodan') && !resultProviders.includes('Shodan')) {
                      resultProviders.push('Shodan');
                    }
                  }
                  
                  return resultProviders;
                })()}
              />
            )}

            {/* Active Provider Results - Collapsible when AI result exists */}
            {isProviderResultsExpanded && (
              <div className="results-list">
                {(() => {
                  // Get unique IOCs globally
                  const allUniqueIOCs = Array.from(new Set(results.map(r => r.ioc.value)));
                  const currentActiveIOC = activeIOCTab && allUniqueIOCs.includes(activeIOCTab)
                    ? activeIOCTab
                    : allUniqueIOCs[0] || '';
                  
                  // Filter results by active IOC first, then by provider
                  const iocResults = results.filter(r => r.ioc.value === currentActiveIOC);
                  const filteredResults = activeProviderTab
                    ? iocResults.filter(r => r.source === activeProviderTab)
                    : iocResults;

                  // If no results for active provider (rate limit pending check)
                  if (filteredResults.length === 0 && activeProviderTab) {
                    // Check if this is a pending rate-limited provider
                    const isPendingGreyNoise = activeProviderTab === 'GreyNoise' && pendingRateLimitProviders.has('greynoise');
                    const isPendingShodan = activeProviderTab === 'Shodan' && pendingRateLimitProviders.has('shodan');
                    const activeIOCData = currentIOCs.find(ioc => ioc.value === currentActiveIOC);
                    const isIPv4 = activeIOCData?.type === IOCType.IPV4;

                    if ((isPendingGreyNoise || isPendingShodan) && isIPv4) {
                      // Show confirmation card for pending provider
                      return (
                        <RateLimitConfirmCard
                          provider={isPendingGreyNoise ? 'greynoise' : 'shodan'}
                          iocCount={1}
                          onConfirm={() => handleRateLimitConfirm(isPendingGreyNoise ? 'greynoise' : 'shodan')}
                          logoSrc={isPendingGreyNoise ? '/provider-icons/greynoise-logo.png' : '/provider-icons/shodan-logo.png'}
                          providerName={activeProviderTab}
                          subtitle={isPendingGreyNoise ? t('providers.greynoise.subtitle') : t('providers.shodan.subtitle')}
                        />
                      );
                    }

                    // Show informative empty state for other providers
                    const supportedTypes = PROVIDER_SUPPORT[activeProviderTab] || [];
                    const activeIOC = currentIOCs.find(ioc => ioc.value === currentActiveIOC);
                    const isUnsupported = activeIOC && !supportedTypes.includes(activeIOC.type);

                    return (
                      <div className="provider-no-results-card">
                        <div className="no-results-header">
                          <Shield size={32} className="no-results-icon" />
                          <h3>{t('providerNoResults.title', { provider: activeProviderTab })}</h3>
                        </div>

                        {isUnsupported && activeIOC && (
                          <div className="searched-iocs-section">
                            <p className="searched-iocs-label">
                              {t('providerNoResults.searchedFor', { count: 1 })}
                            </p>
                            <div className="searched-iocs-list">
                              <div className="searched-ioc-item">
                                <span className="searched-ioc-type">{getIOCTypeLabel(activeIOC.type)}</span>
                                <span className="searched-ioc-value">{activeIOC.value}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <p className="no-results-message">{t('providerNoResults.description')}</p>

                        {supportedTypes.length > 0 && (
                          <div className="provider-supported-section">
                            <span className="supported-section-label">
                              {t('providerNoResults.supportedLabel', { provider: activeProviderTab })}
                            </span>
                            <div className="supported-types-grid">
                              {supportedTypes.map((type, idx) => (
                                <span key={idx} className="supported-type-badge">
                                  {getIOCTypeLabel(type)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  const resultElements = filteredResults.map((result, index) => {
                    // Check for error status first - show error card for all providers
                    if (isErrorResult(result)) {
                      return <ErrorResultCard key={`${result.ioc.value}-${index}`} result={result} />;
                    }

                    if (result.source === 'VirusTotal') {
                      return <VirusTotalResultCard key={`${result.ioc.value}-${index}`} result={result} />;
                    }

                    if (result.source === 'OTX AlienVault') {
                      return <OTXResultCard key={`${result.ioc.value}-${index}`} result={result} />;
                    }

                    if (result.source === 'AbuseIPDB') {
                      return <AbuseIPDBResultCard key={`${result.ioc.value}-${index}`} result={result} />;
                    }

                    if (result.source === 'MalwareBazaar') {
                      return <MalwareBazaarResultCard key={`${result.ioc.value}-${index}`} result={result} />;
                    }

                    if (result.source === 'ARIN') {
                      return <ARINResultCard key={`${result.ioc.value}-${index}`} result={result} />;
                    }

                    if (result.source === 'Shodan') {
                      return <ShodanResultCard key={`${result.ioc.value}-${index}`} result={result} />;
                    }

                    if (result.source === 'GreyNoise') {
                      return <GreyNoiseResultCard key={`${result.ioc.value}-${index}`} result={result} />;
                    }

                    if (result.source === 'URLhaus') {
                      return <URLhausResultCard key={`${result.ioc.value}-${index}`} result={result} />;
                    }

                    if (result.source === 'Pulsedive') {
                      return <PulsediveResultCard key={`${result.ioc.value}-${index}`} result={result} />;
                    }

                    if (result.source === 'Scamalytics') {
                      return <ScamalyticsResultCard key={`${result.ioc.value}-${index}`} result={result} />;
                    }

                    return (
                      <div key={`${result.ioc.value}-${index}`} className="result-card">
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

                  return resultElements;
                })()}
              </div>
            )}
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
