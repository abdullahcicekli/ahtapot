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
} from 'lucide-react';
import { DetectedIOC, IOCAnalysisResult } from '@/types/ioc';
import { detectIOCs, getIOCTypeLabel } from '@/utils/ioc-detector';
import { MessageType } from '@/types/messages';
import './sidepanel.css';

const SidePanel: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [detectedIOCs, setDetectedIOCs] = useState<DetectedIOC[]>([]);
  const [results, setResults] = useState<IOCAnalysisResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Mesajları dinle (content script veya context menu'den)
  useEffect(() => {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === MessageType.OPEN_SIDEPANEL) {
        // IOC'ler direkt gelirse onları kullan
        if (message.payload.iocs) {
          const iocs = message.payload.iocs as DetectedIOC[];
          setDetectedIOCs(iocs);
          setLoading(true);

          // Analiz yap
          chrome.runtime.sendMessage({
            type: MessageType.ANALYZE_IOC,
            payload: { iocs },
          }).then((response) => {
            if (response.success) {
              setResults(response.results);
            }
            setLoading(false);
          });
        } else {
          // Metin gelirse tespit et ve analiz et
          const text = message.payload.selectedText || '';
          setInputText(text);
          handleAnalyze(text);
        }
      }
    });
  }, []);

  // IOC'leri tespit et
  const handleDetect = () => {
    const iocs = detectIOCs(inputText);
    setDetectedIOCs(iocs);
    setResults([]);
  };

  // Analiz yap
  const handleAnalyze = async (text?: string) => {
    const textToAnalyze = text || inputText;
    const iocs = detectIOCs(textToAnalyze);

    if (iocs.length === 0) {
      return;
    }

    setDetectedIOCs(iocs);
    setLoading(true);

    try {
      const response = await chrome.runtime.sendMessage({
        type: MessageType.ANALYZE_IOC,
        payload: { iocs },
      });

      if (response.success) {
        setResults(response.results);
      } else {
        console.error('Analysis failed:', response.error);
      }
    } catch (error) {
      console.error('Error analyzing IOCs:', error);
    } finally {
      setLoading(false);
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
              disabled={detectedIOCs.length === 0 || loading}
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
              {results.map((result, index) => (
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
              ))}
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

        {!inputText && !loading && (
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
