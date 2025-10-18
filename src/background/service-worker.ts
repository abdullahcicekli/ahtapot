import { MessageType, ExtensionMessage } from '@/types/messages';
import { DetectedIOC, IOCAnalysisResult, APIProvider } from '@/types/ioc';
import { APIService } from '@/services/api-service';
import { getAPIKeys } from '@/utils/apiKeyStorage';

/**
 * Background Service Worker
 * API çağrılarını yönetir, API anahtarlarını güvenli tutar
 */

// API service instance
let apiService: APIService | null = null;

// Context menu oluştur
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'ahtapot-analyze',
    title: 'Ahtapot ile Analiz Et',
    contexts: ['selection'],
  });
});

// Context menu tıklaması
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'ahtapot-analyze' && info.selectionText && tab?.id) {
    // Side panel'i aç
    try {
      await chrome.sidePanel.open({ tabId: tab.id });

      // Seçili metni side panel'e gönder
      chrome.runtime.sendMessage({
        type: MessageType.OPEN_SIDEPANEL,
        payload: { selectedText: info.selectionText },
      });
    } catch (error) {
    }
  }
});

// Mesaj dinleyici (content script'ten gelen istekler)
chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, sender, sendResponse) => {
    if (message.type === MessageType.OPEN_SIDEPANEL) {
      // Side panel'i aç
      const tabId = sender.tab?.id;
      if (tabId) {
        chrome.sidePanel
          .open({ tabId })
          .then(() => {
            // Side panel'e IOC'leri gönder - daha uzun timeout ile side panel'in hazır olmasını bekle
            setTimeout(() => {
              chrome.runtime.sendMessage({
                type: MessageType.OPEN_SIDEPANEL,
                payload: message.payload,
              });
            }, 500);
            sendResponse({ success: true });
          })
          .catch((error) => {
            sendResponse({ success: false, error: error.message });
          });
      } else {
        sendResponse({ success: false, error: 'Tab ID bulunamadı' });
      }
      return true; // Async response için gerekli
    }

    if (message.type === MessageType.ANALYZE_IOC) {
      handleAnalyzeIOC(message.payload.iocs)
        .then((response) => {
          sendResponse({ success: true, ...response });
        })
        .catch((error) => {
          sendResponse({ success: false, error: error.message });
        });
      return true;
    }

    if (message.type === MessageType.NAVIGATE_TO_PROVIDER) {
      handleNavigateToProvider(message.payload.provider)
        .then((response) => {
          sendResponse(response);
        })
        .catch((error) => {
          sendResponse({ success: false, error: error.message });
        });
      return true;
    }
  }
);

/**
 * IOC'leri analiz eder
 */
async function handleAnalyzeIOC(
  iocs: DetectedIOC[]
): Promise<{
  results: IOCAnalysisResult[];
  analyzingProviders: APIProvider[];
  completedProviders: { provider: APIProvider; status: 'success' | 'error' }[];
}> {
  // API anahtarlarını al ve service'i başlat (yeni storage format ile)
  const apiKeys = await getAPIKeys();

  // API key kontrolü - yeni format: { key: string, addedAt: number }
  const hasKeys = Object.values(apiKeys).some(
    (keyData) => keyData?.key && keyData.key.trim() !== ''
  );

  if (!hasKeys) {
    return {
      results: iocs.map((ioc) => ({
        ioc,
        source: 'system',
        status: 'error' as const,
        error: 'API anahtarı yapılandırılmamış. Lütfen ayarlardan en az bir API anahtarı ekleyin.',
        timestamp: Date.now(),
      })),
      analyzingProviders: [],
      completedProviders: [],
    };
  }

  // API service'i başlat
  if (!apiService) {
    apiService = new APIService(apiKeys);
  } else {
    apiService.updateAPIKeys(apiKeys);
  }

  const allResults: IOCAnalysisResult[] = [];
  const analyzingProviders: APIProvider[] = [];
  const completedProviders: { provider: APIProvider; status: 'success' | 'error' }[] = [];

  // Her IOC için analiz yap
  for (const ioc of iocs) {
    try {
      const results = await apiService.analyzeIOC(ioc);

      // Başarılı ve hatalı servisleri ayır
      results.forEach((result) => {
        allResults.push(result);

        // Provider'ı bul
        const provider = findProviderByServiceName(result.source);
        if (provider) {
          completedProviders.push({
            provider,
            status: result.status === 'error' ? 'error' : 'success',
          });
        }
      });
    } catch (error) {
      allResults.push({
        ioc,
        source: 'system',
        status: 'error',
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
        timestamp: Date.now(),
      });
    }
  }

  return {
    results: allResults,
    analyzingProviders,
    completedProviders,
  };
}

/**
 * Service adından provider bul
 */
function findProviderByServiceName(serviceName: string): APIProvider | null {
  const mapping: Record<string, APIProvider> = {
    'VirusTotal': APIProvider.VIRUSTOTAL,
    'OTX AlienVault': APIProvider.OTX,
    'AbuseIPDB': APIProvider.ABUSEIPDB,
    'MalwareBazaar': APIProvider.MALWAREBAZAAR,
  };

  return mapping[serviceName] || null;
}

/**
 * Provider sayfasına navigasyon
 */
async function handleNavigateToProvider(provider: string): Promise<{ success: boolean }> {
  const optionsUrl = chrome.runtime.getURL('src/pages/options/index.html');

  // Extension'ın açık olan tüm view'larını al (tabs izni gerektirmez)
  const views = chrome.extension.getViews({ type: 'tab' });

  // Options sayfası açık mı kontrol et
  let optionsView = null;
  for (const view of views) {
    if (view.location.href.includes('src/pages/options/index.html')) {
      optionsView = view;
      break;
    }
  }

  if (optionsView) {
    // Options sayfası açık, URL'i güncelle
    const newUrl = `${optionsUrl}?tab=apiKeys&provider=${provider}`;
    optionsView.location.href = newUrl;

    // Pencereyi öne getir
    try {
      const allTabs = await chrome.tabs.query({});
      for (const tab of allTabs) {
        if (tab.url && tab.url.includes('src/pages/options/index.html')) {
          await chrome.tabs.update(tab.id!, { active: true });
          if (tab.windowId) {
            await chrome.windows.update(tab.windowId, { focused: true });
          }
          break;
        }
      }
    } catch (error) {
      // Could not focus window
    }
  } else {
    // Options sayfası açık değil, yeni sekme aç
    const newUrl = `${optionsUrl}?tab=apiKeys&provider=${provider}`;
    await chrome.tabs.create({ url: newUrl });
  }

  return { success: true };
}

// Extension icon'a tıklandığında options sayfasını aç
chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});
