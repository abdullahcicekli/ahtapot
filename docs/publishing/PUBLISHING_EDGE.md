# Microsoft Edge Add-ons Yayınlama Kılavuzu

Bu kılavuz, Ahtapot uzantısını Microsoft Edge Add-ons mağazasında yayınlamak için gerekli adımları açıklamaktadır.

## Ön Gereksinimler

1. **Microsoft Partner Center Hesabı**
   - Partner Center'a kaydolun: https://partner.microsoft.com/dashboard
   - Geliştirici hesabı oluşturun (ücretsiz)
   - Kayıt: https://partner.microsoft.com/dashboard/microsoftedge/public/login

2. **Build Dosyaları**
   ```bash
   npm run build:edge
   ```
   Bu komut `dist/edge/` klasörüne build dosyalarını oluşturur.

## Edge ve Chrome Uyumluluğu

Edge, Chromium tabanlı olduğu için Chrome uzantıları ile yüksek uyumluluk gösterir:

- Side Panel API: ✅ Destekleniyor
- Service Worker: ✅ Destekleniyor
- Manifest V3: ✅ Destekleniyor
- contextMenus: ✅ Destekleniyor

**Temel Fark**: Edge manifest'te özel ayarlar gerekmez, Chrome manifest'i ile neredeyse aynıdır.

## Yayınlama Adımları

### 1. Build Oluşturma

```bash
# Edge için build
npm run build:edge

# Build dosyalarını zip'le
cd dist/edge
zip -r ../../ahtapot-edge.zip .
cd ../..
```

### 2. Partner Center'a Giriş

1. https://partner.microsoft.com/dashboard/microsoftedge/overview adresine gidin
2. Microsoft hesabınızla giriş yapın
3. "Create new extension" butonuna tıklayın

### 3. Uzantı Yükleme

1. "Upload new package" seçin
2. `ahtapot-edge.zip` dosyasını yükleyin
3. Otomatik doğrulama tamamlanana kadar bekleyin

### 4. Mağaza Bilgileri

#### Özellikler Sekmesi

| Alan | Değer |
|------|-------|
| **Extension name** | Ahtapot IOC Analysis Tool |
| **Short description** | AI-powered threat intelligence for security analysts |
| **Description** | Detaylı açıklama (4000 karakter limit) |
| **Category** | Developer Tools |
| **Privacy policy URL** | https://ahtapot.me/privacy |
| **Website URL** | https://ahtapot.me |
| **Support URL** | https://ahtapot.me/support |

#### Dil Desteği

- Primary language: English (en)
- Additional: Turkish (tr)

Her dil için ayrı açıklamalar girebilirsiniz.

#### Görseller

| Görsel | Boyut | Gereklilik |
|--------|-------|------------|
| Logo | 300x300 PNG | Zorunlu |
| Small promotional tile | 440x280 PNG | Opsiyonel |
| Large promotional tile | 1400x560 PNG | Opsiyonel |
| Screenshots | 640x480 - 1920x1080 | En az 1, max 10 |

#### Yaş Derecelendirmesi

- Uygun kategori: "All ages" veya "Mature 17+"
- Güvenlik aracı olduğu için genellikle "All ages" uygundur

### 5. İzin Açıklamaları

Edge, izinler için açıklama ister:

| İzin | Açıklama |
|------|----------|
| `storage` | Store user preferences and API keys locally |
| `contextMenus` | Add "Analyze with Ahtapot" to right-click menu |
| `activeTab` | Read selected text to detect IOCs |
| `sidePanel` | Display analysis results in side panel |
| `host_permissions` | Send requests to security provider APIs |

### 6. Gönderme ve İnceleme

1. Tüm alanları doldurun
2. "Publish" butonuna tıklayın
3. İnceleme sürecini bekleyin

#### İnceleme Süresi

- İlk inceleme: 1-7 iş günü (genellikle 3-5 gün)
- Güncelleme incelemeleri: 1-3 iş günü

#### İnceleme Durumları

- **In Draft**: Henüz gönderilmedi
- **In Review**: İnceleme süreci devam ediyor
- **Published**: Mağazada yayında
- **Rejected**: Reddedildi (geri bildirim verilir)

## Güncelleme Yayınlama

1. Version'ı artırın:
   - `package.json`
   - `src/manifests/edge.json`

2. Yeni build:
   ```bash
   npm run build:edge
   cd dist/edge && zip -r ../../ahtapot-edge.zip . && cd ../..
   ```

3. Partner Center'da:
   - Uzantı sayfasına gidin
   - "Update" butonuna tıklayın
   - Yeni zip'i yükleyin
   - Değişiklikleri açıklayın
   - "Publish" tıklayın

## Chrome'dan Edge'e Geçiş

Edge, Chrome uzantılarını doğrudan destekler. Ancak Edge mağazasına yayınlamak için:

1. Manifest'te Edge-specific değişiklik gerekmez
2. Aynı kod tabanı kullanılabilir
3. Sadece ayrı bir mağaza kaydı yapılmalı

### Chrome Web Store'dan Aktarma

Microsoft, Chrome Web Store'dan uzantı aktarımı da sunar:
1. Partner Center'da "Import extension from Chrome Web Store" seçin
2. Chrome uzantı ID'sini girin
3. Otomatik aktarım başlar

**Not**: Bu seçenek mevcutsa kolaylık sağlar, ancak manuel yükleme daha fazla kontrol verir.

## Test Etme

Yayınlamadan önce Edge'de test edin:

1. `edge://extensions/` adresine gidin
2. "Developer mode" açın (sol alt köşe)
3. "Load unpacked" tıklayın
4. `dist/edge/` klasörünü seçin
5. Tüm özellikleri test edin:
   - Side panel açılıyor mu?
   - Context menu çalışıyor mu?
   - API istekleri başarılı mı?

## Önemli Notlar

- Edge uzantıları Chrome ile %99 uyumludur
- Side Panel API tam desteklenir
- Manifest V3 tercih edilir
- İnceleme süreci Chrome'a benzer

## Yararlı Bağlantılar

- [Microsoft Partner Center](https://partner.microsoft.com/dashboard/microsoftedge)
- [Edge Extension Documentation](https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/)
- [Publishing Guide](https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/publish-extension)
- [Extension Store Policies](https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/store-policies/developer-policies)

## Destek

- Documentation: https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/
- Developer Support: https://partner.microsoft.com/support
- Community: https://techcommunity.microsoft.com/t5/microsoft-edge-insider/bd-p/MicrosoftEdgeInsider
