import React, { useEffect, useState } from 'react';
import { APIProvider } from '@/types/ioc';
import { getConfiguredProvidersSorted } from '@/utils/apiKeyStorage';
import './ProviderStatusBadges.css';

interface ProviderStatus {
  provider: APIProvider;
  label: string;
  enabled: boolean;
  addedAt?: number; // For sorting
}

interface ProviderStatusBadgesProps {
  analyzingProviders: APIProvider[];
  completedProviders: { provider: APIProvider; status: 'success' | 'error' }[];
  activeProvider?: string;
  onProviderClick?: (providerName: string) => void;
}

const PROVIDER_LABELS: Record<APIProvider, string> = {
  [APIProvider.VIRUSTOTAL]: 'VirusTotal',
  [APIProvider.OTX]: 'OTX AlienVault', // Match the source name from API results
  [APIProvider.ABUSEIPDB]: 'AbuseIPDB',
};

// Map providers to their logo images
const PROVIDER_LOGOS: Record<APIProvider, string> = {
  [APIProvider.VIRUSTOTAL]: '/provider-icons/virustotal_logo.png',
  [APIProvider.OTX]: '/provider-icons/alienVaultOtx-logo.png',
  [APIProvider.ABUSEIPDB]: '/provider-icons/abuseipdb-logo.png',
};

// Tooltip messages for disabled providers
const TOOLTIP_MESSAGES: Record<APIProvider, string> = {
  [APIProvider.VIRUSTOTAL]: 'Click to configure VirusTotal API key',
  [APIProvider.OTX]: 'Click to configure OTX AlienVault API key',
  [APIProvider.ABUSEIPDB]: 'Click to configure AbuseIPDB API key',
};

export const ProviderStatusBadges: React.FC<ProviderStatusBadgesProps> = ({
  analyzingProviders,
  completedProviders,
  activeProvider,
  onProviderClick,
}) => {
  const [allProviders, setAllProviders] = useState<ProviderStatus[]>([]);

  // Load and sort providers
  useEffect(() => {
    loadAndSortProviders();
  }, [analyzingProviders, completedProviders]);

  // Listen for API key changes in storage
  useEffect(() => {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.apiKeys) {
        // API keys changed, reload providers
        loadAndSortProviders();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  async function loadAndSortProviders() {
    try {
      // Get configured providers with timestamps
      const configuredProviders = await getConfiguredProvidersSorted();
      const configuredSet = new Set(configuredProviders.map((p) => p.provider));

      // Create provider status list
      const providers: ProviderStatus[] = [];

      // Add enabled providers first (sorted by addedAt)
      configuredProviders.forEach(({ provider, addedAt }) => {
        providers.push({
          provider,
          label: PROVIDER_LABELS[provider],
          enabled: true,
          addedAt,
        });
      });

      // Add disabled providers after (alphabetical order)
      const disabledProviders = Object.values(APIProvider)
        .filter((provider) => !configuredSet.has(provider))
        .sort((a, b) => PROVIDER_LABELS[a].localeCompare(PROVIDER_LABELS[b]));

      disabledProviders.forEach((provider) => {
        providers.push({
          provider,
          label: PROVIDER_LABELS[provider],
          enabled: false,
        });
      });

      setAllProviders(providers);
    } catch (error) {
      console.error('Failed to load providers:', error);
    }
  }

  const handleBadgeClick = async (provider: ProviderStatus) => {
    if (!provider.enabled) {
      // Get current tab to check if we're on options page
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];
      const optionsUrl = chrome.runtime.getURL('src/pages/options/index.html');

      if (currentTab?.url?.includes('src/pages/options/index.html')) {
        // We're already on options page
        const urlObj = new URL(currentTab.url);
        const currentTab_activeTab = urlObj.searchParams.get('tab') || 'general';

        if (currentTab_activeTab === 'apiKeys') {
          // Already on API Keys tab, just scroll and highlight
          chrome.tabs.sendMessage(currentTab.id!, {
            type: 'SCROLL_TO_PROVIDER',
            provider: provider.provider
          });
        } else {
          // On different tab (general), switch to API Keys tab
          chrome.tabs.sendMessage(currentTab.id!, {
            type: 'SWITCH_TAB_AND_SCROLL',
            tab: 'apiKeys',
            provider: provider.provider
          });
        }
      } else {
        // Not on options page, open in new tab
        const newUrl = `${optionsUrl}?provider=${provider.provider}`;
        chrome.tabs.create({ url: newUrl });
      }
    } else if (onProviderClick) {
      // If enabled and onProviderClick is provided, trigger tab change
      onProviderClick(provider.label);
    }
  };

  return (
    <div className="provider-badges-container">
      {allProviders.map((provider) => {
        const isActive = activeProvider === provider.label;
        return (
          <div
            key={provider.provider}
            className={`provider-badge ${provider.enabled ? 'enabled' : 'disabled'} ${isActive ? 'active' : ''}`}
            onClick={() => handleBadgeClick(provider)}
            title={provider.enabled ? '' : TOOLTIP_MESSAGES[provider.provider]}
            style={{ cursor: 'pointer' }}
          >
            <div className="provider-logo-wrapper">
              <img
                src={PROVIDER_LOGOS[provider.provider]}
                alt={provider.label}
                className="provider-logo"
              />
            </div>

            <span className="provider-name">{provider.label}</span>
          </div>
        );
      })}
    </div>
  );
};
