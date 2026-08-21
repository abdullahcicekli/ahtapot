import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { APIProvider } from '@/types/ioc';
import { getConfiguredProvidersSorted } from '@/utils/apiKeyStorage';
import { getProviderOrder } from '@/utils/providerOrderStorage';
import './ProviderSlider.css';

// Tooltip state
interface TooltipState {
  visible: boolean;
  text: string;
  x: number;
  y: number;
}

interface ProviderItem {
  provider: APIProvider;
  label: string;
  enabled: boolean;
  logo: string;
}

interface ProviderSliderProps {
  activeProvider?: string;
  onProviderClick?: (providerName: string) => void;
  visibleProviders?: string[];
}

const PROVIDER_LABELS: Record<APIProvider, string> = {
  [APIProvider.VIRUSTOTAL]: 'VirusTotal',
  [APIProvider.OTX]: 'OTX AlienVault',
  [APIProvider.ABUSEIPDB]: 'AbuseIPDB',
  [APIProvider.MALWAREBAZAAR]: 'MalwareBazaar',
  [APIProvider.ARIN]: 'ARIN',
  [APIProvider.SHODAN]: 'Shodan',
  [APIProvider.GREYNOISE]: 'GreyNoise',
  [APIProvider.URLHAUS]: 'URLhaus',
  [APIProvider.PULSEDIVE]: 'Pulsedive',
  [APIProvider.SCAMALYTICS]: 'Scamalytics',
  [APIProvider.SIBERGUVENLIK]: 'Turkiye SGB',
};

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
  [APIProvider.SIBERGUVENLIK]: '/provider-icons/siberguvenlik-logo.png',
};

export const ProviderSlider: React.FC<ProviderSliderProps> = ({
  activeProvider,
  onProviderClick,
  visibleProviders,
}) => {
  const [allProviders, setAllProviders] = useState<ProviderItem[]>([]);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  
  // Tooltip state
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, text: '', x: 0, y: 0 });
  
  // Drag to scroll state
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const loadProviders = useCallback(async () => {
    try {
      const [configuredProviders, customOrder] = await Promise.all([
        getConfiguredProvidersSorted(),
        getProviderOrder()
      ]);

      const configuredSet = new Set(configuredProviders.map((p) => p.provider));

      const providers: ProviderItem[] = customOrder.map((provider) => ({
        provider,
        label: PROVIDER_LABELS[provider],
        enabled: configuredSet.has(provider),
        logo: PROVIDER_LOGOS[provider],
      }));

      setAllProviders(providers);
    } catch (error) {
      console.error('Failed to load providers:', error);
    }
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  useEffect(() => {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.apiKeys || changes.providerOrder) {
        loadProviders();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, [loadProviders]);

  // Check if scroll indicator should be shown
  useEffect(() => {
    const checkScroll = () => {
      if (sliderRef.current) {
        const { scrollWidth, clientWidth } = sliderRef.current;
        setShowScrollIndicator(scrollWidth > clientWidth);
      }
    };

    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [allProviders, visibleProviders]);

  // Drag to scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
    sliderRef.current.style.cursor = 'grabbing';
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (sliderRef.current) {
      sliderRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Scroll speed multiplier
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      if (sliderRef.current) {
        sliderRef.current.style.cursor = 'grab';
      }
    }
  };

  const handleProviderClick = (provider: ProviderItem) => {
    // Don't trigger click if we were dragging
    if (isDragging) return;
    
    if (!provider.enabled) {
      chrome.runtime.sendMessage({
        type: 'NAVIGATE_TO_PROVIDER',
        payload: { provider: provider.provider }
      });
    } else if (onProviderClick) {
      onProviderClick(provider.label);
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // Tooltip handlers
  const showTooltip = (e: React.MouseEvent, text: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({
      visible: true,
      text,
      x: rect.left + rect.width / 2,
      y: rect.bottom + 8
    });
  };

  const hideTooltip = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  // Filter providers based on visibleProviders
  const displayedProviders = visibleProviders === undefined
    ? []
    : allProviders.filter((provider) => visibleProviders.includes(provider.label));

  if (displayedProviders.length === 0) {
    return null;
  }

  return (
    <div className="provider-slider-container">
      <div 
        className={`provider-slider ${isDragging ? 'dragging' : ''}`}
        ref={sliderRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { handleMouseLeave(); hideTooltip(); }}
      >
        {displayedProviders.map((provider) => {
          const isActive = activeProvider === provider.label;

          return (
            <div
              key={provider.provider}
              className={`provider-slide-item ${provider.enabled ? 'enabled' : 'disabled'} ${isActive ? 'active' : ''}`}
              onClick={() => handleProviderClick(provider)}
              onMouseEnter={(e) => showTooltip(e, provider.label)}
              onMouseLeave={hideTooltip}
            >
              <div className="provider-slide-logo">
                <img
                  src={provider.logo}
                  alt={provider.label}
                  draggable={false}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Fixed position tooltip */}
      {tooltip.visible && (
        <div 
          className="provider-tooltip"
          style={{ 
            left: tooltip.x, 
            top: tooltip.y 
          }}
        >
          {tooltip.text}
        </div>
      )}
      
      {showScrollIndicator && (
        <button className="slider-scroll-btn" onClick={scrollRight}>
          <ChevronRight size={20} />
        </button>
      )}
    </div>
  );
};
