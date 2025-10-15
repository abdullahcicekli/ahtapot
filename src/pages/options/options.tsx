import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Save, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { APIProvider } from '@/types/ioc';
import './options.css';

interface APIKeyConfig {
  provider: APIProvider;
  label: string;
  description: string;
  placeholder: string;
  link: string;
}

const API_CONFIGS: APIKeyConfig[] = [
  {
    provider: APIProvider.VIRUSTOTAL,
    label: 'VirusTotal',
    description: 'Dosya, URL ve IP adresi analizi',
    placeholder: 'VirusTotal API anahtarınız',
    link: 'https://www.virustotal.com/gui/my-apikey',
  },
  {
    provider: APIProvider.SHODAN,
    label: 'Shodan',
    description: 'IP adresi ve ağ cihazları analizi',
    placeholder: 'Shodan API anahtarınız',
    link: 'https://account.shodan.io/',
  },
  {
    provider: APIProvider.ABUSEIPDB,
    label: 'AbuseIPDB',
    description: 'IP adresi kötüye kullanım kontrolü',
    placeholder: 'AbuseIPDB API anahtarınız',
    link: 'https://www.abuseipdb.com/account/api',
  },
  {
    provider: APIProvider.URLSCAN,
    label: 'URLScan.io',
    description: 'URL ve web sitesi analizi',
    placeholder: 'URLScan.io API anahtarınız',
    link: 'https://urlscan.io/user/profile/',
  },
  {
    provider: APIProvider.HIBP,
    label: 'Have I Been Pwned',
    description: 'E-posta veri ihlali kontrolü',
    placeholder: 'HIBP API anahtarınız',
    link: 'https://haveibeenpwned.com/API/Key',
  },
];

const OptionsPage: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API anahtarlarını yükle
  useEffect(() => {
    loadAPIKeys();
  }, []);

  async function loadAPIKeys() {
    try {
      const result = await chrome.storage.local.get('apiKeys');
      setApiKeys(result.apiKeys || {});
    } catch (err) {
      setError('API anahtarları yüklenemedi');
      console.error('Error loading API keys:', err);
    }
  }

  // API anahtarını güncelle
  const handleKeyChange = (provider: APIProvider, value: string) => {
    setApiKeys((prev) => ({
      ...prev,
      [provider]: value,
    }));
    setSaved(false);
  };

  // Görünürlüğü değiştir
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

  // API anahtarlarını kaydet
  const handleSave = async () => {
    try {
      await chrome.storage.local.set({ apiKeys });
      setSaved(true);
      setError(null);

      // 3 saniye sonra mesajı gizle
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('API anahtarları kaydedilemedi');
      console.error('Error saving API keys:', err);
    }
  };

  return (
    <div className="options-container">
      <header className="options-header">
        <div className="header-content">
          <img
            src="/icons/logo-white.png"
            alt="Ahtapot Logo"
            className="header-logo"
          />
          <div className="header-text">
            <h1>API Ayarları</h1>
            <p>Güvenlik analizi için API anahtarlarınızı yapılandırın</p>
          </div>
        </div>
      </header>

      <main className="options-main">
        <div className="info-card">
          <AlertCircle size={20} />
          <div>
            <strong>Gizlilik Notu:</strong> API anahtarlarınız yalnızca
            cihazınızda güvenli şekilde saklanır ve hiçbir sunucuya
            gönderilmez.
          </div>
        </div>

        <div className="api-keys-section">
          <h2>API Anahtarları</h2>
          <p className="section-description">
            Her bir güvenlik aracı için API anahtarınızı girin. İsterseniz
            sadece kullanmak istediğiniz araçların anahtarlarını ekleyebilirsiniz.
          </p>

          <div className="api-keys-list">
            {API_CONFIGS.map((config) => (
              <div key={config.provider} className="api-key-card">
                <div className="api-key-header">
                  <div>
                    <h3>{config.label}</h3>
                    <p className="api-key-description">{config.description}</p>
                  </div>
                  <a
                    href={config.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="api-key-link"
                  >
                    Anahtarı Al
                  </a>
                </div>

                <div className="api-key-input-wrapper">
                  <input
                    type={
                      visibleKeys.has(config.provider) ? 'text' : 'password'
                    }
                    placeholder={config.placeholder}
                    value={apiKeys[config.provider] || ''}
                    onChange={(e) =>
                      handleKeyChange(config.provider, e.target.value)
                    }
                    className="api-key-input"
                    aria-label={`${config.label} API anahtarı`}
                  />
                  <button
                    type="button"
                    onClick={() => toggleVisibility(config.provider)}
                    className="toggle-visibility-btn"
                    aria-label={
                      visibleKeys.has(config.provider)
                        ? 'Anahtarı gizle'
                        : 'Anahtarı göster'
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
            ))}
          </div>
        </div>

        <div className="actions-section">
          <button onClick={handleSave} className="save-btn">
            <Save size={18} />
            Kaydet
          </button>

          {saved && (
            <div className="success-message">
              <CheckCircle size={18} />
              API anahtarları başarıyla kaydedildi
            </div>
          )}

          {error && (
            <div className="error-message">
              <AlertCircle size={18} />
              {error}
            </div>
          )}
        </div>
      </main>

      <footer className="options-footer">
        <p>Ahtapot v1.0.0 • Siber Güvenlik IOC Analiz Aracı</p>
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
