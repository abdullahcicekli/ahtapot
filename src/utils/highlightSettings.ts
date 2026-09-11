/**
 * Sayfa üzerinde IOC işaretleme (highlight) ayarları.
 *
 * Ayar her sekmede doğrudan chrome.storage.onChanged ile dinlenir; açıp
 * kapatmak için sayfa yenilemeye gerek yoktur.
 */

export interface HighlightSettings {
  /** Sayfa taranıp tespit edilen IOC'ler işaretlensin mi */
  enabled: boolean;
}

export const HIGHLIGHT_SETTINGS_KEY = 'ahtapot_highlight_settings';

/**
 * Varsayılan kapalı: özellik her sayfanın DOM'una dokunduğu için
 * kullanıcının bilerek açması gerekir.
 */
export const DEFAULT_HIGHLIGHT_SETTINGS: HighlightSettings = {
  enabled: false,
};

export async function getHighlightSettings(): Promise<HighlightSettings> {
  try {
    const result = await chrome.storage.local.get(HIGHLIGHT_SETTINGS_KEY);
    const stored = result[HIGHLIGHT_SETTINGS_KEY] as Partial<HighlightSettings> | undefined;

    return { ...DEFAULT_HIGHLIGHT_SETTINGS, ...stored };
  } catch {
    return DEFAULT_HIGHLIGHT_SETTINGS;
  }
}

export async function saveHighlightSettings(settings: HighlightSettings): Promise<void> {
  await chrome.storage.local.set({ [HIGHLIGHT_SETTINGS_KEY]: settings });
}
