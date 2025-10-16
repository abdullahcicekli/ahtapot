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
  [APIProvider.SHODAN]: 'Shodan',
  [APIProvider.ABUSEIPDB]: 'AbuseIPDB',
  [APIProvider.URLSCAN]: 'URLScan',
  [APIProvider.HIBP]: 'HIBP',
  [APIProvider.BLOCKCHAIN]: 'Blockchain',
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

  const getStatusIcon = (status: ProviderStatus['status']) => {
    switch (status) {
      case 'analyzing':
        return <Loader size={14} className="status-icon spinning" />;
      case 'success':
        return <CheckCircle size={14} className="status-icon success" />;
      case 'error':
        return <XCircle size={14} className="status-icon error" />;
      default:
        return null;
    }
  };

  if (providers.length === 0) {
    return (
      <div className="provider-badges-container">
        <div className="no-providers-warning">
          <AlertCircle size={16} />
          <span>API anahtarı yapılandırılmamış</span>
        </div>
      </div>
    );
  }
};
