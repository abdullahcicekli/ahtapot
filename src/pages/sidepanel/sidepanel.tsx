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
import { DetectedIOC, IOCAnalysisResult, APIProvider } from '@/types/ioc';
import { detectIOCs, getIOCTypeLabel } from '@/utils/ioc-detector';
import { MessageType } from '@/types/messages';
import { ProviderStatusBadges } from '@/components/ProviderStatusBadges';
import { VirusTotalResultCard } from '@/components/results/VirusTotalResultCard';
import './sidepanel.css';

const SidePanel: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [detectedIOCs, setDetectedIOCs] = useState<DetectedIOC[]>([]);
  const [results, setResults] = useState<IOCAnalysisResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzingProviders, setAnalyzingProviders] = useState<APIProvider[]>([]);
  const [completedProviders, setCompletedProviders] = useState<{ provider: APIProvider; status: 'success' | 'error' }[]>([]);
  const [hasApiKeys, setHasApiKeys] = useState<boolean | null>(null);

  // API anahtarlarını kontrol et
  useEffect(() => {
    checkAPIKeys();

    // Storage değişikliklerini dinle
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

  // Mesajları dinle (content script veya context menu'den)
  useEffect(() => {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === MessageType.OPEN_SIDEPANEL) {
        // IOC'ler direkt gelirse onları kullan
        if (message.payload.iocs) {
          const iocs = message.payload.iocs as DetectedIOC[];
          setDetectedIOCs(iocs);
          handleAnalyze(undefined, iocs);
        } else {
          // Metin gelirse tespit et ve analiz et
          const text = message.payload.selectedText || '';
          setInputText(text);
          handleAnalyze(text);
        }
      }
    });
  }, []);

  async function checkAPIKeys() {
    try {
      const result = await chrome.storage.local.get('apiKeys');
      const apiKeys = result.apiKeys || {};
      const hasKeys = Object.values(apiKeys).some(
        (key) => key && String(key).trim() !== ''
      );
      setHasApiKeys(hasKeys);
    } catch (error) {
      console.error('Error checking API keys:', error);
      setHasApiKeys(false);
    }
  }

  // IOC'leri tespit et
  const handleDetect = () => {
    const iocs = detectIOCs(inputText);
    setDetectedIOCs(iocs);
    setResults([]);
  };

  // Analiz yap
  const handleAnalyze = async (text?: string, providedIOCs?: DetectedIOC[]) => {
    const textToAnalyze = text || inputText;
    const iocs = providedIOCs || detectIOCs(textToAnalyze);

    console.log('[Sidepanel] Starting analysis with IOCs:', iocs);

    if (iocs.length === 0) {
      console.log('[Sidepanel] No IOCs detected');
      return;
    }

    setDetectedIOCs(iocs);
    setLoading(true);
    setResults([]);
    setCompletedProviders([]);

    // API key kontrolü
    if (hasApiKeys === false) {
      console.log('[Sidepanel] No API keys configured');
      setLoading(false);
      return;
    }

    console.log('[Sidepanel] Sending ANALYZE_IOC message to background');

    try {
      const response = await chrome.runtime.sendMessage({
        type: MessageType.ANALYZE_IOC,
        payload: { iocs },
      });

      console.log('[Sidepanel] Received response:', response);

      if (response && response.success) {
        console.log('[Sidepanel] Analysis successful, results:', response.results);
        setResults(response.results || []);

        // Provider durumlarını güncelle
        if (response.analyzingProviders) {
          setAnalyzingProviders(response.analyzingProviders);
        }
        if (response.completedProviders) {
          setCompletedProviders(response.completedProviders);
        }
      } else {
        console.error('[Sidepanel] Analysis failed:', response?.error);
      }
    } catch (error) {
      console.error('[Sidepanel] Error analyzing IOCs:', error);
    } finally {
      setLoading(false);
      setAnalyzingProviders([]);
    }
  };

  // Durum ikonu
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

  // Durum etiketi
  const getStatusLabel = (status: IOCAnalysisResult['status']) => {
    const labels = {
      safe: 'Güvenli',
      suspicious: 'Şüpheli',
      malicious: 'Zararlı',
      unknown: 'Bilinmiyor',
      error: 'Hata',
    };
    return labels[status];
  };

  return (
    <div className="sidepanel-container">
      <header className="sidepanel-header">
        <div className="header-title">
          <img
            src="/icons/logo-white.png"
            alt="Ahtapot Logo"
            className="header-logo"
          />
        </div>
        <button
          onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('src/pages/options/index.html') })}
          className="settings-btn"
          title="Ayarlar"
          aria-label="Ayarları aç"
        >
          <Settings size={20} />
        </button>
      </header>

      <main className="sidepanel-main">
        {/* API Key Uyarısı */}
        {hasApiKeys === false && (
          <div className="warning-card">
            <AlertTriangle size={20} />
            <div className="warning-content">
              <strong>API Anahtarı Gerekli</strong>
              <p>IOC analizi yapabilmek için en az bir API anahtarı yapılandırmanız gerekiyor.</p>
              <button
                onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('src/pages/options/index.html') })}
                className="setup-btn"
              >
                API Anahtarlarını Yapılandır
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
        )}

        <div className="input-section">
          <label htmlFor="ioc-input" className="input-label">
            IOC'leri Girin veya Yapıştırın
          </label>
          <textarea
            id="ioc-input"
            placeholder="IP adresleri, domain'ler, hash'ler, URL'ler veya diğer IOC'leri buraya yapıştırın..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="ioc-input"
            rows={6}
          />
          <div className="input-actions">
            <button onClick={handleDetect} className="detect-btn">
              <Search size={18} />
              IOC'leri Tespit Et
            </button>
            <button
              onClick={() => handleAnalyze()}
              className="analyze-btn"
              disabled={detectedIOCs.length === 0 || loading || hasApiKeys === false}
            >
              {loading ? (
                <>
                  <Loader size={18} className="spinner" />
                  Analiz Ediliyor...
                </>
              ) : (
                <>
                  <Shield size={18} />
                  Analiz Et
                </>
              )}
            </button>
          </div>
        </div>

        {/* Provider Status Badges */}
        {(loading || results.length > 0) && hasApiKeys !== false && (
          <ProviderStatusBadges
            analyzingProviders={analyzingProviders}
            completedProviders={completedProviders}
          />
        )}

        {detectedIOCs.length > 0 && (
          <div className="detected-section">
            <h2 className="section-title">
              Tespit Edilen IOC'ler ({detectedIOCs.length})
            </h2>
            <div className="ioc-list">
              {detectedIOCs.map((ioc, index) => (
                <div key={index} className="ioc-item">
                  <div className="ioc-type">{getIOCTypeLabel(ioc.type)}</div>
                  <div className="ioc-value">{ioc.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="results-section">
            <h2 className="section-title">Analiz Sonuçları</h2>
            <div className="results-list">
              {results.map((result, index) => {
                // Render provider-specific card
                if (result.source === 'VirusTotal') {
                  return <VirusTotalResultCard key={index} result={result} />;
                }

                // Default generic card for other providers
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
                    {result.details && (
                      <div className="result-details">
                        {result.details.message || JSON.stringify(result.details)}
                      </div>
                    )}
                    {result.error && (
                      <div className="result-error">{result.error}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!loading && detectedIOCs.length === 0 && inputText && (
          <div className="empty-state">
            <Search size={48} />
            <h3>IOC Tespit Edilemedi</h3>
            <p>
              Girdiğiniz metinde herhangi bir güvenlik göstergesi (IOC) bulunamadı.
            </p>
          </div>
        )}

        {!inputText && !loading && detectedIOCs.length === 0 && results.length === 0 && (
          <div className="welcome-state">
            <Shield size={64} />
            <h2>Ahtapot'a Hoş Geldiniz</h2>
            <p>
              Siber güvenlik göstergelerini (IOC) hızlıca analiz edin.
              Yukarıdaki alana IP adresleri, domain'ler, hash'ler veya diğer
              IOC'leri yapıştırın.
            </p>
            <div className="supported-iocs">
              <h3>Desteklenen IOC Türleri:</h3>
              <ul>
                <li>IP Adresleri (IPv4/IPv6)</li>
                <li>Domain ve URL'ler</li>
                <li>Dosya Hash'leri (MD5, SHA1, SHA256)</li>
                <li>E-posta Adresleri</li>
                <li>CVE Numaraları</li>
                <li>Kripto Para Adresleri</li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// React uygulamasını başlat
const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <SidePanel />
    </React.StrictMode>
  );
}
