# 🚀 Chrome'a Extension Yükleme Kılavuzu

## ✅ Ön Gereksinimler

Extension zaten build edildi ve `dist` klasörü hazır!

Eğer `dist` klasörü yoksa:
```bash
npm install
npm run build
```

## 📋 Adım Adım Yükleme

### 1. Chrome Extensions Sayfasını Açın

**Seçenek A - Adres Çubuğundan:**
```
chrome://extensions/
```
yazıp Enter'a basın.

**Seçenek B - Menüden:**
1. Chrome'da sağ üstteki 3 nokta menüye tıklayın
2. "Extensions" → "Manage Extensions" seçin

### 2. Developer Mode'u Aktif Edin

Sayfanın **sağ üst köşesinde** "Developer mode" (Geliştirici modu) toggle'ını **açın**.

```
┌─────────────────────────────────────────┐
│ Extensions                Developer mode│
│                              [●─────────]│  ← Bunu açın
└─────────────────────────────────────────┘
```

### 3. Extension'ı Yükleyin

Developer mode açıldığında yeni butonlar görünecek.

1. **"Load unpacked"** (Paketlenmemiş uzantı yükle) butonuna tıklayın

```
┌─────────────────────────────────────────┐
│ ⟳ Load unpacked  📦 Pack extension     │
└─────────────────────────────────────────┘
```

2. Açılan dosya seçim penceresinde:
   - `ahtapot-extension` klasörüne gidin
   - **`dist`** klasörünü seçin
   - "Select" (Seç) butonuna tıklayın

### 4. Extension Yüklendi! 🎉

Şimdi extension kartını görmelisiniz:

```
┌─────────────────────────────────────────────┐
│ 🐙 Ahtapot - IOC Analiz Aracı             │
│                                      [●]    │ ← Açık/Kapalı
│ ID: abcdef...                              │
│ Version: 1.0.0                             │
│                                             │
│ Siber güvenlik IOC'lerini hızlıca analiz  │
│ edin                                        │
│                                             │
│ [Details] [Remove] [Errors]               │
└─────────────────────────────────────────────┘
```

## ✅ Doğrulama

Extension doğru yüklendiğini kontrol edin:

### 1. Hata Kontrolü
- Extension kartında kırmızı bir "Errors" butonu **olmamalı**
- Varsa, tıklayıp hataları okuyun

### 2. Icon Kontrolü
- Chrome toolbar'ında (adres çubuğunun yanında) extension icon'ları arasında Ahtapot olmalı
- ⚠️ Icon placeholder olduğu için Chrome'un default icon'u görünebilir (normal)

### 3. Permissions Kontrolü
Extension kartında "Details"e tıklayın ve izinleri kontrol edin:
- ✅ Storage
- ✅ Context menus
- ✅ Active tab
- ✅ Side panel

## 🧪 İlk Test

### Test 1: Context Menu
1. Herhangi bir web sayfasında sağ tıklayın
2. **"Ahtapot ile Analiz Et"** seçeneğini görmelisiniz
3. ✅ Görünüyorsa context menu çalışıyor!

### Test 2: Floating Button
1. Herhangi bir web sayfasına gidin
2. Aşağıdaki IP adresini kopyalayıp yapıştırın: `8.8.8.8`
3. IP'yi fareyle seçin
4. Mor **"Analiz Et"** butonu görünmelidir
5. ✅ Görünüyorsa IOC detection çalışıyor!

### Test 3: Side Panel
1. Floating button'a veya context menu'ye tıklayın
2. Sağ tarafta side panel açılmalı
3. IOC'ler listelenmelidir
4. ✅ Açılıyorsa side panel çalışıyor!

### Test 4: Options Page
1. Extension icon'una tıklayın (toolbar'da)
2. API ayarları sayfası açılmalı
3. ✅ Açılıyorsa options page çalışıyor!

## ⚠️ Yaygın Sorunlar ve Çözümler

### Sorun 1: "Errors" Butonu Kırmızı
**Nedeni:** TypeScript build hataları veya manifest sorunları

**Çözüm:**
1. Terminal'de:
   ```bash
   cd ahtapot-extension
   rm -rf dist
   npm run build
   ```
2. Chrome'da extension'ı "Remove" edin
3. Yeniden "Load unpacked" yapın

### Sorun 2: Floating Button Görünmüyor
**Nedeni:** Content script yüklenmemiş olabilir

**Çözüm:**
1. Web sayfasını yenileyin (F5)
2. Geçerli bir IOC seçtiğinizden emin olun
3. Console'da hata var mı kontrol edin:
   - Sayfada sağ tık → Inspect → Console

### Sorun 3: Context Menu'de Görünmüyor
**Nedeni:** Background service worker çalışmıyor

**Çözüm:**
1. `chrome://extensions/` sayfasında
2. Extension kartında "Service worker" linkini tıklayın
3. Console'da hata var mı kontrol edin
4. Extension'ı disable/enable yapın

### Sorun 4: Side Panel Açılmıyor
**Nedeni:** Chrome versiyonu çok eski (Side panel Chrome 114+ gerektirir)

**Çözüm:**
1. Chrome versiyonunuzu kontrol edin:
   - Menü → Help → About Google Chrome
2. Chrome 114 veya üstü olmalı
3. Değilse Chrome'u güncelleyin

### Sorun 5: "dist" Klasörü Yok
**Nedeni:** Extension henüz build edilmemiş

**Çözüm:**
```bash
cd ahtapot-extension
npm install     # İlk kez kurulumda
npm run build   # Build işlemi
```

## 🔄 Extension'ı Güncelleme

Kod değişikliği yaptıktan sonra:

1. **Yeniden build edin:**
   ```bash
   npm run build
   ```

2. **Chrome'da reload edin:**
   - `chrome://extensions/` sayfasında
   - Extension kartında **⟳ Reload** butonuna tıklayın

3. **Aktif sekmeleri yenileyin:**
   - Content script değişikliklerinin etkili olması için
   - Açık web sayfalarını F5 ile yenileyin

## 🔧 Development Mode

Sürekli geliştirme yapıyorsanız:

```bash
npm run dev
```

Bu modda:
- Dosya değişiklikleri otomatik build olur
- Ama yine de Chrome'da manual reload gerekir
- Hot reload content script'ler için çalışmaz

## 📱 Extension Icon'unu Görme

Toolbar'da görmek için:

1. Chrome adres çubuğunun yanındaki **puzzle icon** 🧩'a tıklayın
2. "Ahtapot - IOC Analiz Aracı" yanındaki **pin** 📌 icon'una tıklayın
3. Artık extension icon toolbar'da sabit görünecek

## 🎯 Sonraki Adımlar

Extension yüklendikten sonra:

1. **API Anahtarları Ekleyin** (opsiyonel):
   - Extension icon → Options
   - VirusTotal, Shodan vb. için API key girin

2. **Gerçek Test Yapın**:
   - Threat intelligence blog'larında IOC'ler arayın
   - Şüpheli URL'leri test edin
   - Hash'leri analiz edin

3. **Geri Bildirim Verin**:
   - Hataları not edin
   - Önerileri kaydedin
   - İyileştirme fikirlerini listeleyin

## 📚 Daha Fazla Bilgi

- **README.md**: Tam dokümantasyon
- **SETUP.md**: Detaylı kurulum kılavuzu
- **PROJECT_STATUS.md**: Proje durumu ve özellikler
- **ICONS.md**: Icon oluşturma rehberi

---

**Yardıma mı ihtiyacınız var?**

Sorun yaşıyorsanız:
1. Chrome Console'u kontrol edin (F12)
2. Extension'ın "Errors" butonuna tıklayın
3. Background service worker console'una bakın
4. GitHub'da issue açın veya dokümantasyonu inceleyin

**İyi testler! 🚀**
