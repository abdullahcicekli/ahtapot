import { MessageType, ExtensionMessage } from '@/types/messages';
import { DetectedIOC, IOCAnalysisResult, APIProvider } from '@/types/ioc';
import { APIService } from '@/services/api-service';

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

  console.log('Ahtapot extension installed successfully');
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
      console.error('Side panel açılamadı:', error);
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
            console.error('Side panel açılamadı:', error);
            sendResponse({ success: false, error: error.message });
          });
      } else {
        sendResponse({ success: false, error: 'Tab ID bulunamadı' });
      }
      return true; // Async response için gerekli
    }

    if (message.type === MessageType.ANALYZE_IOC) {
      console.log('[Background] Received ANALYZE_IOC message:', message.payload.iocs);

      handleAnalyzeIOC(message.payload.iocs)
        .then((response) => {
          console.log('[Background] Analysis complete:', response);
          sendResponse({ success: true, ...response });
        })
        .catch((error) => {
          console.error('[Background] Analysis error:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Async response için gerekli
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
  // API anahtarlarını al ve service'i başlat
  const apiKeys = await getStoredAPIKeys();
  console.log('[Background] Loaded API keys:', Object.keys(apiKeys));

  // API key kontrolü
  const hasKeys = Object.values(apiKeys).some(
    (key) => key && String(key).trim() !== ''
  );

  if (!hasKeys) {
    console.log('[Background] No API keys found');
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

  console.log('[Background] API keys found, initializing service');

  // API service'i başlat
  if (!apiService) {
    apiService = new APIService(apiKeys);
    console.log('[Background] Created new APIService instance');
  } else {
    apiService.updateAPIKeys(apiKeys);
    console.log('[Background] Updated existing APIService');
  }

  const allResults: IOCAnalysisResult[] = [];
  const analyzingProviders: APIProvider[] = [];
  const completedProviders: { provider: APIProvider; status: 'success' | 'error' }[] = [];

  // Her IOC için analiz yap
  for (const ioc of iocs) {
    console.log('[Background] Analyzing IOC:', ioc);
    try {
      const results = await apiService.analyzeIOC(ioc);
      console.log('[Background] IOC analysis results:', results);

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
      console.error('[Background] Error analyzing IOC:', error);
      allResults.push({
        ioc,
        source: 'system',
        status: 'error',
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
        timestamp: Date.now(),
      });
    }
  }

  console.log('[Background] All results:', allResults);

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
    'Shodan': APIProvider.SHODAN,
    'AbuseIPDB': APIProvider.ABUSEIPDB,
    'URLScan.io': APIProvider.URLSCAN,
    'Have I Been Pwned': APIProvider.HIBP,
    'Blockchain.info': APIProvider.BLOCKCHAIN,
  };

  return mapping[serviceName] || null;
}

/**
 * Depolanmış API anahtarlarını al
 */
async function getStoredAPIKeys(): Promise<Record<string, string>> {
  const result = await chrome.storage.local.get('apiKeys');
  return result.apiKeys || {};
}

/**
 * API anahtarlarını depola
 */
export async function saveAPIKeys(
  keys: Record<string, string>
): Promise<void> {
  await chrome.storage.local.set({ apiKeys: keys });
}

// Extension icon'a tıklandığında options sayfasını aç
chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});
