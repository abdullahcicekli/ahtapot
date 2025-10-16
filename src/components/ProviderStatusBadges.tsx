import React, { useEffect, useState } from 'react';
import { CheckCircle, Loader, XCircle, AlertCircle } from 'lucide-react';
import { APIProvider } from '@/types/ioc';
import './ProviderStatusBadges.css';

interface ProviderStatus {
  provider: APIProvider;
  label: string;
  status: 'idle' | 'analyzing' | 'success' | 'error';
  enabled: boolean;
}

interface ProviderStatusBadgesProps {
  analyzingProviders: APIProvider[];
  completedProviders: { provider: APIProvider; status: 'success' | 'error' }[];
}

const PROVIDER_LABELS: Record<APIProvider, string> = {
  [APIProvider.VIRUSTOTAL]: 'VirusTotal',
  [APIProvider.OTX]: 'OTX AlienVault',
};

export const ProviderStatusBadges: React.FC<ProviderStatusBadgesProps> = ({
  analyzingProviders,
  completedProviders,
}) => {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [configuredProviders, setConfiguredProviders] = useState<Set<APIProvider>>(new Set());

  // API anahtarlarını yükle
  useEffect(() => {
    loadConfiguredProviders();
  }, []);

  // Provider durumlarını güncelle
  useEffect(() => {
    const newProviders: ProviderStatus[] = [];

    configuredProviders.forEach((provider) => {
      const isAnalyzing = analyzingProviders.includes(provider);
      const completed = completedProviders.find((c) => c.provider === provider);

      let status: ProviderStatus['status'] = 'idle';
      if (isAnalyzing) {
        status = 'analyzing';
      } else if (completed) {
        status = completed.status;
      }

      newProviders.push({
        provider,
        label: PROVIDER_LABELS[provider],
        status,
        enabled: true,
      });
    });

    setProviders(newProviders);
  }, [analyzingProviders, completedProviders, configuredProviders]);

  async function loadConfiguredProviders() {
    try {
      const result = await chrome.storage.local.get('apiKeys');
      const apiKeys = result.apiKeys || {};
      const configured = new Set<APIProvider>();

      Object.entries(apiKeys).forEach(([provider, key]) => {
        if (key && String(key).trim() !== '') {
          configured.add(provider as APIProvider);
        }
      });

      setConfiguredProviders(configured);
    } catch (error) {
      console.error('Failed to load configured providers:', error);
    }
  }

  if (providers.length === 0) {
    return (
      <div className="provider-badges-container">
        <div className="no-providers-warning">
          <AlertCircle size={16} />
          <span>No API keys configured</span>
        </div>
      </div>
    );
  }

  return (
    <div className="provider-badges-container">
      {providers.map((provider) => (
        <div
          key={provider.provider}
          className={`provider-badge ${provider.status}`}
        >
          {provider.status === 'analyzing' && (
            <Loader size={14} className="status-icon spinning" />
          )}
          {provider.status === 'success' && (
            <CheckCircle size={14} className="status-icon success" />
          )}
          {provider.status === 'error' && (
            <XCircle size={14} className="status-icon error" />
          )}
          <span>{provider.label}</span>
        </div>
      ))}
    </div>
  );
};
