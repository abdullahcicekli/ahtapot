import React, { useEffect, useState, memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { APIProvider } from '@/types/ioc';
import { getConfiguredProvidersSorted } from '@/utils/apiKeyStorage';
import { getProviderOrder } from '@/utils/providerOrderStorage';
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
  visibleProviders?: string[]; // Only show these providers (by label name)
}

const PROVIDER_LABELS: Record<APIProvider, string> = {
  [APIProvider.VIRUSTOTAL]: 'VirusTotal',
  [APIProvider.OTX]: 'OTX AlienVault', // Match the source name from API results
  [APIProvider.ABUSEIPDB]: 'AbuseIPDB',
  [APIProvider.MALWAREBAZAAR]: 'MalwareBazaar',
  [APIProvider.ARIN]: 'ARIN',
  [APIProvider.SHODAN]: 'Shodan',
  [APIProvider.GREYNOISE]: 'GreyNoise',
  [APIProvider.URLHAUS]: 'URLhaus',
  [APIProvider.PULSEDIVE]: 'Pulsedive',
  [APIProvider.SCAMALYTICS]: 'Scamalytics',
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
  [APIProvider.URLHAUS]: '/provider-icons/abuse-logo.png',
  [APIProvider.PULSEDIVE]: '/provider-icons/pulsedive-logo.png',
  [APIProvider.SCAMALYTICS]: '/provider-icons/scamalytics-logo.png',
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
  [APIProvider.URLHAUS]: 'urlhaus',
  [APIProvider.PULSEDIVE]: 'pulsedive',
  [APIProvider.SCAMALYTICS]: 'scamalytics',
};

/**
 * Provider Status Badges Component
 * OPTIMIZED: Memoized to prevent unnecessary re-renders
 */
export const ProviderStatusBadges: React.FC<ProviderStatusBadgesProps> = memo(({
  analyzingProviders,
  completedProviders,
  activeProvider,
  onProviderClick,
  visibleProviders,
}) => {
  const { t } = useTranslation('options');
  const [allProviders, setAllProviders] = useState<ProviderStatus[]>([]);

  // OPTIMIZED: Memoize loadAndSortProviders to prevent recreation on every render
  const loadAndSortProviders = useCallback(async () => {
    try {
      // Get configured providers and custom order
      const [configuredProviders, customOrder] = await Promise.all([
        getConfiguredProvidersSorted(),
        getProviderOrder()
      ]);
      
      const configuredSet = new Set(configuredProviders.map((p) => p.provider));

      // Create provider status list sorted by custom order
      const providers: ProviderStatus[] = [];

      // Sort all providers by custom order
      customOrder.forEach((provider) => {
        const isEnabled = configuredSet.has(provider);
        const configuredProvider = configuredProviders.find(p => p.provider === provider);
        
        providers.push({
          provider,
          label: PROVIDER_LABELS[provider],
          enabled: isEnabled,
          addedAt: configuredProvider?.addedAt,
        });
      });

      setAllProviders(providers);
    } catch (error) {
      // Failed to load providers
      console.error('Failed to load providers:', error);
    }
  }, []);

  // Load and sort providers
  useEffect(() => {
    loadAndSortProviders();
  }, [analyzingProviders, completedProviders, loadAndSortProviders]);

  // Listen for API key and provider order changes in storage
  useEffect(() => {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.apiKeys || changes.providerOrder) {
        // API keys or provider order changed, reload providers
        loadAndSortProviders();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [loadAndSortProviders]);

  // OPTIMIZED: Memoize click handler
  const handleBadgeClick = useCallback(async (provider: ProviderStatus) => {
    if (!provider.enabled) {
      chrome.runtime.sendMessage({
        type: 'NAVIGATE_TO_PROVIDER',
        payload: { provider: provider.provider }
      });
    } else if (onProviderClick) {
      // If enabled and onProviderClick is provided, trigger tab change
      onProviderClick(provider.label);
    }
  }, [onProviderClick]);

  // Filter providers based on visibleProviders prop
  // If undefined, show nothing (before search)
  // If array, only show providers in the array (maintaining custom order from allProviders)
  const displayedProviders = visibleProviders === undefined
    ? []
    : allProviders.filter((provider) => visibleProviders.includes(provider.label));

  return (
    <div className="provider-badges-container">
      {displayedProviders.map((provider) => {
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
});

ProviderStatusBadges.displayName = 'ProviderStatusBadges';
