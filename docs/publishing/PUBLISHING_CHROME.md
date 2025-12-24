# Chrome Web Store Yayınlama Kılavuzu

Bu kılavuz, Ahtapot uzantısını Chrome Web Store'da yayınlamak için gerekli adımları açıklamaktadır.

## Ön Gereksinimler

1. **Google Developer Hesabı**
   - Chrome Web Store Developer Dashboard'a erişim
   - Tek seferlik $5 kayıt ücreti
   - Kayıt: https://chrome.google.com/webstore/devconsole/register

2. **Build Dosyaları**
   ```bash
   npm run build:chrome
   ```
   Bu komut `dist/chrome/` klasörüne build dosyalarını oluşturur.

## Yayınlama Adımları

### 1. Build Oluşturma

```bash
# Chrome için build
npm run build:chrome

# Build dosyalarını zip'le
cd dist/chrome
zip -r ../../ahtapot-chrome.zip .
cd ../..
```

### 2. Chrome Developer Dashboard

1. https://chrome.google.com/webstore/devconsole adresine gidin
2. "Yeni öğe" butonuna tıklayın
3. `ahtapot-chrome.zip` dosyasını yükleyin

### 3. Mağaza Bilgileri

#### Temel Bilgiler
- **Ad**: Ahtapot IOC Analysis Tool
- **Özet (132 karakter)**: AI-powered threat intelligence for security analysts. Analyze IPs, domains, URLs, hashes with 10+ providers.
- **Açıklama**: Detaylı açıklama (README.md'den alınabilir)
- **Kategori**: Developer Tools veya Productivity

#### Görseller
- **İkon**: 128x128 PNG (zaten mevcut: `public/icons/icon-128.png`)
- **Ekran Görüntüleri**: En az 1, maksimum 5 adet (1280x800 veya 640x400)
- **Küçük Tanıtım Görseli**: 440x280 PNG
- **Büyük Tanıtım Görseli** (opsiyonel): 1400x560 PNG

#### Gizlilik
- **Gizlilik Politikası URL'si**: https://ahtapot.me/privacy
- **İzin Açıklamaları**: Her izin için neden gerekli olduğunu açıklayın

### 4. İzin Açıklamaları

Mağazada sorulacak izin açıklamaları:

| İzin | Açıklama |
|------|----------|
| `storage` | Kullanıcının API anahtarlarını ve tercihlerini yerel olarak saklamak için |
| `contextMenus` | Sağ tık menüsüne "Ahtapot ile Analiz Et" seçeneği eklemek için |
| `activeTab` | Kullanıcının seçtiği metinden IOC'leri tespit etmek için |
| `sidePanel` | Analiz sonuçlarını yan panelde göstermek için |
| `host_permissions` | Güvenlik sağlayıcılarının API'lerine istek göndermek için |

### 5. İnceleme Süreci

- İlk inceleme: 1-3 iş günü
- Güncelleme incelemeleri: Genellikle 24 saat içinde
- Reddedilirse: Geri bildirime göre düzeltme yapın ve tekrar gönderin

## Güncelleme Yayınlama

1. `manifest.json` ve `package.json`'da version'ı artırın
2. `CHANGELOG.md`'yi güncelleyin
3. Yeni build oluşturun:
   ```bash
   npm run build:chrome
   cd dist/chrome && zip -r ../../ahtapot-chrome.zip . && cd ../..
   ```
4. Developer Dashboard'da "Package" sekmesinden yeni zip'i yükleyin
5. "Submit for review" butonuna tıklayın

## Önemli Notlar

- Chrome Web Store, MV3 (Manifest V3) uzantılarını tercih eder
- Side Panel API Chrome 114+ gerektirir
- Host permissions için justification gerekebilir
- Her güncelleme incelemeye tabidir

## Yararlı Bağlantılar

- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Publishing Tutorial](https://developer.chrome.com/docs/webstore/publish/)
- [Best Practices](https://developer.chrome.com/docs/webstore/best_practices/)

## Mevcut Mağaza Bağlantısı

Ahtapot Chrome Web Store'da yayında:
https://chromewebstore.google.com/detail/ahtapot-ioc-analysis-tool/gmekhigahdiddngdhfdkeefcomcankpg
