import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  [APIProvider.MALWAREBAZAAR]: 'MalwareBazaar',
  [APIProvider.ARIN]: 'ARIN',
  [APIProvider.SHODAN]: 'Shodan',
  [APIProvider.GREYNOISE]: 'GreyNoise',
};

// Map providers to their logo images
const PROVIDER_LOGOS: Record<APIProvider, string> = {
  [APIProvider.VIRUSTOTAL]: '/provider-icons/virustotal_logo.png',
  [APIProvider.OTX]: '/provider-icons/alienVaultOtx-logo.png',
  [APIProvider.ABUSEIPDB]: '/provider-icons/abuseipdb-logo.png',
  [APIProvider.MALWAREBAZAAR]: '/provider-icons/abuse-logo.png',
  [APIProvider.ARIN]: '/provider-icons/arin-logo.png',
  [APIProvider.SHODAN]: '/provider-icons/shodan-logo.png',
  [APIProvider.GREYNOISE]: '/provider-icons/greynoise-logo.png',
};

// Map provider enum to i18n key
const PROVIDER_I18N_KEYS: Record<APIProvider, string> = {
  [APIProvider.VIRUSTOTAL]: 'virustotal',
  [APIProvider.OTX]: 'otx',
  [APIProvider.ABUSEIPDB]: 'abuseipdb',
  [APIProvider.MALWAREBAZAAR]: 'malwarebazaar',
  [APIProvider.ARIN]: 'arin',
  [APIProvider.SHODAN]: 'shodan',
  [APIProvider.GREYNOISE]: 'greynoise',
};

export const ProviderStatusBadges: React.FC<ProviderStatusBadgesProps> = ({
  analyzingProviders,
  completedProviders,
  activeProvider,
  onProviderClick,
}) => {
  const { t } = useTranslation('options');
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
      // Failed to load providers
    }
  }

  const handleBadgeClick = async (provider: ProviderStatus) => {
    if (!provider.enabled) {
      chrome.runtime.sendMessage({
        type: 'NAVIGATE_TO_PROVIDER',
        payload: { provider: provider.provider }
      });
    } else if (onProviderClick) {
      // If enabled and onProviderClick is provided, trigger tab change
      onProviderClick(provider.label);
    }
  };

  return (
    <div className="provider-badges-container">
      {allProviders.map((provider) => {
        const isActive = activeProvider === provider.label;
        const tooltipKey = PROVIDER_I18N_KEYS[provider.provider];
        return (
          <div
            key={provider.provider}
            className={`provider-badge ${provider.enabled ? 'enabled' : 'disabled'} ${isActive ? 'active' : ''}`}
            onClick={() => handleBadgeClick(provider)}
            title={provider.enabled ? '' : t(`tooltips.${tooltipKey}`)}
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
