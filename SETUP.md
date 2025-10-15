# 🚀 Ahtapot Extension - Hızlı Başlangıç Kılavuzu

## 1️⃣ İlk Kurulum (5 dakika)

### Adım 1: Bağımlılıkları Yükleyin
Terminal'de proje klasörüne gidin ve çalıştırın:

```bash
cd ahtapot-extension
npm install
```

Bu komut tüm gerekli paketleri yükleyecektir (~2-3 dakika).

### Adım 2: Build Edin
```bash
npm run build
```

Bu komut `dist` klasörünü oluşturacaktır.

### Adım 3: Chrome'a Yükleyin

1. Chrome tarayıcınızı açın
2. Adres çubuğuna `chrome://extensions/` yazın ve Enter'a basın
3. Sağ üst köşeden **"Developer mode" (Geliştirici modu)** açın
4. Sol üstten **"Load unpacked" (Paketlenmemiş uzantı yükle)** butonuna tıklayın
5. Açılan pencereden `ahtapot-extension/dist` klasörünü seçin
6. ✅ Ahtapot extension yüklendi!

## 2️⃣ İlk Test (2 dakika)

### Test 1: Floating Button
1. Herhangi bir web sayfasına gidin (örn: google.com)
2. Aşağıdaki IP adresini kopyalayın: `8.8.8.8`
3. Sayfada bir yere yapıştırın ve fareyle seçin
4. 🎉 Mor "Analiz Et" butonu görünmelidir!

### Test 2: Context Menu
1. Aşağıdaki metni kopyalayın:
   ```
   IP: 192.168.1.1
   Domain: example.com
   Hash: 5d41402abc4b2a76b9719d911017c592
   ```
2. Bir web sayfasına yapıştırın ve tamamını seçin
3. Sağ tıklayın → **"Ahtapot ile Analiz Et"** seçeneğini görmelisiniz
4. 🎉 Tıklayınca side panel açılmalı!

### Test 3: Options Sayfası
1. Extension icon'una (extensions alanında) tıklayın
2. 🎉 API ayarları sayfası açılmalı!

## 3️⃣ Development Mode (Geliştirme için)

Eğer extension üzerinde geliştirme yapacaksanız:

```bash
npm run dev
```

Bu modda:
- Dosyalarda yaptığınız değişiklikler otomatik build olur
- Chrome'da `chrome://extensions/` sayfasından "Reload" (Yenile) butonu ile güncelleyin
- Her değişiklikte extension'ı reload etmeyi unutmayın!

## 4️⃣ API Anahtarları (Opsiyonel)

Extension şu an API anahtarları olmadan da çalışır (test sonuçları döner).
Gerçek analiz için:

1. Extension icon'una tıklayın → Options sayfası açılır
2. Kullanmak istediğiniz servislere kaydolun:
   - **VirusTotal** (Ücretsiz): https://www.virustotal.com/gui/my-apikey
   - **AbuseIPDB** (Ücretsiz): https://www.abuseipdb.com/account/api
   - **Shodan** (Ücretli): https://account.shodan.io/
3. API anahtarlarını ilgili alanlara yapıştırın
4. "Kaydet" butonuna tıklayın

## ⚠️ Yaygın Sorunlar ve Çözümler

### Sorun: "npm: command not found"
**Çözüm:** Node.js kurulu değil. [nodejs.org](https://nodejs.org) adresinden indirip kurun.

### Sorun: Build hataları
**Çözüm:** Node modüllerini temizleyin ve tekrar yükleyin:
```bash
rm -rf node_modules
rm package-lock.json
npm install
npm run build
```

### Sorun: Extension Chrome'da görünmüyor
**Çözüm:**
1. `dist` klasörünün var olduğundan emin olun
2. Chrome'da Developer mode'un açık olduğunu kontrol edin
3. Extension'da hata varsa kırmızı hata mesajı görünür - detaylara tıklayın

### Sorun: Floating button görünmüyor
**Çözüm:**
1. Geçerli bir IOC seçtiğinizden emin olun (IP, domain, hash vb.)
2. Console'da hata var mı kontrol edin (sağ tık → Inspect → Console)
3. Extension'ı reload edin (`chrome://extensions/` → Reload butonu)

### Sorun: Side panel açılmıyor
**Çözüm:**
1. Chrome'un güncel versiyonu kullanın (Side panel Chrome 114+ gerektirir)
2. Background service worker'da hata var mı kontrol edin
3. Extension'ı tamamen kaldırıp yeniden yükleyin

## 📱 Icon Ekleme (Opsiyonel)

Extension icon'ları şu an placeholder. Kendiniz eklemek için:

1. 4 farklı boyutta PNG icon oluşturun:
   - 16x16 piksel → `icon-16.png`
   - 32x32 piksel → `icon-32.png`
   - 48x48 piksel → `icon-48.png`
   - 128x128 piksel → `icon-128.png`

2. Bu dosyaları `public/icons/` klasörüne koyun

3. Yeniden build edin:
   ```bash
   npm run build
   ```

4. Chrome'da extension'ı reload edin

## 🎓 Sonraki Adımlar

✅ Extension çalışıyor mu? Harika!

Şimdi:
1. `src/services/api-service.ts` dosyasını inceleyin - API entegrasyonları burada
2. `src/utils/ioc-detector.ts` dosyasına bakın - IOC tespit algoritması
3. Yeni IOC tipleri veya API'ler ekleyerek extension'ı geliştirin!

## 📚 Faydalı Linkler

- Chrome Extension Dökümantasyonu: https://developer.chrome.com/docs/extensions/
- React Dökümantasyonu: https://react.dev/
- TypeScript Dökümantasyonu: https://www.typescriptlang.org/docs/
- Vite Dökümantasyonu: https://vitejs.dev/guide/

## 💡 İpuçları

- Console'u sürekli açık tutun - hataları hemen göreceksiniz
- Development mode'da hot reload yoktur, manuel reload gerekir
- API rate limit'lerine dikkat edin (özellikle ücretsiz hesaplarda)
- Test için güvenli/bilinen IOC'ler kullanın

---

**Yardıma mı ihtiyacınız var?** GitHub'da issue açın veya documentation'ı inceleyin!
