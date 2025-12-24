# Firefox Add-ons Yayınlama Kılavuzu

Bu kılavuz, Ahtapot uzantısını Firefox Add-ons (AMO - addons.mozilla.org) mağazasında yayınlamak için gerekli adımları açıklamaktadır.

## Ön Gereksinimler

1. **Mozilla Hesabı**
   - Firefox hesabı oluşturun: https://accounts.firefox.com/
   - Developer Hub'a kaydolun: https://addons.mozilla.org/developers/

2. **Build Dosyaları**
   ```bash
   npm run build:firefox
   ```
   Bu komut `dist/firefox/` klasörüne build dosyalarını oluşturur.

## Firefox Manifest Özellikleri

Firefox manifest dosyası (`src/manifests/firefox.json`) Chrome'dan farklıdır:

```json
{
  "browser_specific_settings": {
    "gecko": {
      "id": "ahtapot@ioc-analysis.security",
      "strict_min_version": "109.0"
    }
  },
  "permissions": ["menus"],  // Chrome'da "contextMenus"
  "sidebar_action": { ... }  // Chrome'da "side_panel"
}
```

## Yayınlama Adımları

### 1. Build Oluşturma

```bash
# Firefox için build
npm run build:firefox

# Build dosyalarını zip'le
cd dist/firefox
zip -r ../../ahtapot-firefox.zip .
cd ../..
```

### 2. Firefox Developer Hub

1. https://addons.mozilla.org/developers/ adresine gidin
2. "Submit a New Add-on" butonuna tıklayın
3. "On this site" seçeneğini seçin (AMO'da listelensin)

### 3. Uzantı Yükleme

1. `ahtapot-firefox.zip` dosyasını yükleyin
2. Otomatik doğrulama bekleyin
3. Kaynak kodu yükleme (isteğe bağlı ama önerilen)

### 4. Kaynak Kodu Gönderimi

Firefox, kaynak kodunu incelemeyi isteyebilir. Bunun için:

```bash
# Kaynak kodunu hazırla (node_modules hariç)
git archive --format=zip HEAD -o ahtapot-source.zip
```

veya

```bash
# Manuel olarak
zip -r ahtapot-source.zip . -x "node_modules/*" -x "dist/*" -x ".git/*"
```

### 5. Mağaza Bilgileri

#### Temel Bilgiler
- **Ad**: Ahtapot IOC Analysis Tool
- **Slug**: ahtapot-ioc-analysis
- **Özet**: AI-powered threat intelligence for security analysts
- **Açıklama**: Detaylı açıklama (Markdown desteklenir)
- **Kategori**: Security & Privacy veya Developer Tools

#### Görseller
- **İkon**: 128x128 PNG (otomatik olarak manifest'ten alınır)
- **Ekran Görüntüleri**: PNG veya JPG, en az 1 adet
  - Önerilen boyutlar: 1280x800, 1920x1080

#### Etiketler (Tags)
- security
- threat-intelligence
- ioc-analysis
- virustotal
- malware
- cybersecurity

#### Gizlilik Politikası
- URL girin: https://ahtapot.me/privacy

### 6. İnceleme Süreci

Firefox inceleme süreci:

1. **Otomatik İnceleme**: Anında (lint kontrolleri)
2. **İnsan İncelemesi**: 1-7 gün (karmaşıklığa bağlı)

#### İnceleme İpuçları

- Kaynak kodu temiz ve okunabilir olsun
- Obfuscation kullanmayın
- Build adımlarını açıklayın
- API anahtarları veya hassas bilgiler olmadığından emin olun

### 7. Listeleme Durumu

- **Listed**: AMO'da aranabilir ve yüklenebilir
- **Unlisted**: Sadece doğrudan link ile erişilebilir (test için)

## Firefox Özel Konular

### Sidebar vs Side Panel

Firefox'ta Chrome'un sidePanel API'si yoktur. Bunun yerine:

1. **Sidebar Action**: Kullanıcı tarayıcı menüsünden açar
2. **Yeni Sekme**: Otomatik olarak yeni sekmede açılır

Mevcut implementasyonda Firefox için yeni sekme yaklaşımı kullanılmaktadır.

### Service Worker vs Background Scripts

Firefox MV3, background scripts'i de destekler:
- Firefox 109+: MV3 desteği
- Firefox 121+: Service Worker desteği (tam)

Manifest'te `"type": "module"` ile ES modülleri kullanılabilir.

### Context Menus

- Chrome: `chrome.contextMenus`
- Firefox: `browser.menus`

Platform layer bu farkı otomatik olarak yönetir.

## Güncelleme Yayınlama

1. Version'ı artırın:
   - `package.json`
   - `src/manifests/firefox.json`

2. Yeni build:
   ```bash
   npm run build:firefox
   cd dist/firefox && zip -r ../../ahtapot-firefox.zip . && cd ../..
   ```

3. Developer Hub'da:
   - Uzantı sayfasına gidin
   - "Upload New Version" tıklayın
   - Yeni zip'i yükleyin
   - Değişiklikleri açıklayın

## Önemli Notlar

- Firefox, gizlilik konusunda çok hassastır
- Minimum Firefox sürümü: 109.0 (MV3 için)
- Extension ID (`gecko.id`) benzersiz olmalı
- İnceleme reddedilirse, geri bildirimi dikkatlice okuyun

## Yararlı Bağlantılar

- [Firefox Add-ons Developer Hub](https://addons.mozilla.org/developers/)
- [Firefox Extension Workshop](https://extensionworkshop.com/)
- [Browser Extension API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [AMO Policies](https://extensionworkshop.com/documentation/publish/add-on-policies/)

## Test Etme

Yayınlamadan önce Firefox'ta test edin:

1. `about:debugging#/runtime/this-firefox` adresine gidin
2. "Load Temporary Add-on" tıklayın
3. `dist/firefox/manifest.json` dosyasını seçin
4. Tüm özellikleri test edin

## İletişim

- Add-on Support: amo-editors@mozilla.org
- Developer Community: https://discourse.mozilla.org/c/add-ons
