import { MessageType, ExtensionMessage } from '@/types/messages';
import { DetectedIOC, IOCAnalysisResult } from '@/types/ioc';

/**
 * Background Service Worker
 * API çağrılarını yönetir, API anahtarlarını güvenli tutar
 */

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
      handleAnalyzeIOC(message.payload.iocs)
        .then((results) => {
          sendResponse({ success: true, results });
        })
        .catch((error) => {
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
): Promise<IOCAnalysisResult[]> {
  const results: IOCAnalysisResult[] = [];

  // API anahtarlarını al
  const apiKeys = await getStoredAPIKeys();

  // Her IOC için analiz yap
  for (const ioc of iocs) {
    try {
      const result = await analyzeIOC(ioc, apiKeys);
      results.push(result);
    } catch (error) {
      results.push({
        ioc,
        source: 'error',
        status: 'error',
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
        timestamp: Date.now(),
      });
    }
  }

  return results;
}

/**
 * Tek bir IOC'yi analiz eder
 */
async function analyzeIOC(
  ioc: DetectedIOC,
  _apiKeys: Record<string, string>
): Promise<IOCAnalysisResult> {
  // Şimdilik mock data döndür (gerçek API entegrasyonu sonra eklenecek)
  // Bu, extension'ın çalışabilir halde olmasını sağlar

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ioc,
        source: 'mock',
        status: 'unknown',
        details: {
          message: 'API entegrasyonu henüz eklenmedi. Bu bir test sonucudur.',
        },
        timestamp: Date.now(),
      });
    }, 1000);
  });
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
