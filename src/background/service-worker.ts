import { MessageType, ExtensionMessage } from '@/types/messages';
import { DetectedIOC, IOCAnalysisResult, APIProvider } from '@/types/ioc';
import { APIService } from '@/services/api-service';
import { getAPIKeys } from '@/utils/apiKeyStorage';
import { findProviderByServiceName } from '@/utils/providerMappings';
import { initializeDevelopmentAPIKeys } from '@/utils/devApiKeys';
import { initializeDevelopmentAIKeys } from '@/utils/devAIKeys';
import { runtime, tabs, windows } from '@/platform';
import { SidePanel } from '@/platform/sidepanel';
import { ContextMenus } from '@/platform/menus';

/**
 * Background Service Worker
 * API çağrılarını yönetir, API anahtarlarını güvenli tutar
 */

// API service instance
let apiService: APIService | null = null;

// Context menu oluştur
runtime.onInstalled.addListener(async () => {
  ContextMenus.create({
    id: 'ahtapot-analyze',
    title: 'Ahtapot ile Analiz Et',
    contexts: ['selection'],
  }, async (info, tab) => {
    if (info.selectionText && tab?.id) {
      // Side panel'i aç
      try {
        await SidePanel.open({ tabId: tab.id });

        // Seçili metni side panel'e gönder
        runtime.sendMessage({
          type: MessageType.OPEN_SIDEPANEL,
          payload: { selectedText: info.selectionText },
        });
      } catch (error) {
        console.error('[ServiceWorker] Error opening side panel:', error);
      }
    }
  });

  // Initialize development API keys from .env (only in dev mode)
  await initializeDevelopmentAPIKeys();

  // Initialize development AI API keys from .env (only in dev mode)
  await initializeDevelopmentAIKeys();
});

// Mesaj dinleyici (content script'ten gelen istekler)
// Using promise-based response pattern for webextension-polyfill
runtime.onMessage.addListener(
  (message: ExtensionMessage, sender): Promise<unknown> | undefined => {
    if (message.type === MessageType.OPEN_SIDEPANEL) {
      // Side panel'i aç
      const tabId = sender.tab?.id;
      if (tabId) {
        return SidePanel.open({ tabId })
          .then(() => {
            // Side panel'e IOC'leri gönder - daha uzun timeout ile side panel'in hazır olmasını bekle
            setTimeout(() => {
              runtime.sendMessage({
                type: MessageType.OPEN_SIDEPANEL,
                payload: message.payload,
              });
            }, 500);
            return { success: true };
          })
          .catch((error: Error) => {
            return { success: false, error: error.message };
          });
      } else {
        return Promise.resolve({ success: false, error: 'Tab ID bulunamadı' });
      }
    }

    if (message.type === MessageType.ANALYZE_IOC) {
      return handleAnalyzeIOC(
        message.payload.iocs,
        message.payload.excludeProviders,
        message.payload.includeProviders
      )
        .then((response) => {
          return { success: true, ...response };
        })
        .catch((error) => {
          return { success: false, error: error.message };
        });
    }

    if (message.type === MessageType.NAVIGATE_TO_PROVIDER) {
      return handleNavigateToProvider(message.payload.provider)
        .then((response) => {
          return response;
        })
        .catch((error) => {
          return { success: false, error: error.message };
        });
    }

    return undefined;
  }
);

/**
 * IOC'leri analiz eder
 */
async function handleAnalyzeIOC(
  iocs: DetectedIOC[],
  excludeProviders?: APIProvider[],
  includeProviders?: APIProvider[]
): Promise<{
  results: IOCAnalysisResult[];
  analyzingProviders: APIProvider[];
  completedProviders: { provider: APIProvider; status: 'success' | 'error' }[];
}> {
  // API anahtarlarını al ve service'i başlat (yeni storage format ile)
  const apiKeys = await getAPIKeys();

  // API service'i başlat (ARIN her zaman mevcut, API key gerektirmez)
  if (!apiService) {
    apiService = new APIService(apiKeys);
  } else {
    apiService.updateAPIKeys(apiKeys);
  }

  const allResults: IOCAnalysisResult[] = [];
  const analyzingProviders: APIProvider[] = [];
  const completedProviders: { provider: APIProvider; status: 'success' | 'error' }[] = [];

  // OPTIMIZED: Parallel IOC processing instead of sequential
  // Process all IOCs in parallel for better performance
  const iocPromises = iocs.map(async (ioc) => {
    try {
      // Non-null assertion: apiService is initialized above
      const results = await apiService!.analyzeIOC(ioc, {
        excludeProviders,
        includeProviders
      });
      return { success: true, results };
    } catch (error) {
      return {
        success: false,
        results: [{
          ioc,
          source: 'system',
          status: 'error' as const,
          error: error instanceof Error ? error.message : 'Bilinmeyen hata',
          timestamp: Date.now(),
        }]
      };
    }
  });

  // Wait for all IOC analyses to complete
  const settledResults = await Promise.allSettled(iocPromises);

  // Collect all results
  settledResults.forEach((settledResult) => {
    if (settledResult.status === 'fulfilled') {
      const { results } = settledResult.value;

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
    }
  });

  return {
    results: allResults,
    analyzingProviders,
    completedProviders,
  };
}


/**
 * Provider sayfasına navigasyon
 */
async function handleNavigateToProvider(provider: string): Promise<{ success: boolean }> {
  const optionsUrl = runtime.getURL('src/pages/options/index.html');
  const newUrl = `${optionsUrl}?tab=apiKeys&provider=${provider}`;

  // Check if options page is already open
  try {
    const allTabs = await tabs.query({});
    for (const tab of allTabs) {
      if (tab.url && tab.url.includes('src/pages/options/index.html')) {
        // Update existing tab
        await tabs.update(tab.id!, { active: true, url: newUrl });
        if (tab.windowId) {
          await windows.update(tab.windowId, { focused: true });
        }
        return { success: true };
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Error checking existing tabs:', error);
  }

  // Options sayfası açık değil, yeni sekme aç
  await tabs.create({ url: newUrl });

  return { success: true };
}
