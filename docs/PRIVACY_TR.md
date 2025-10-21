# Ahtapot Güvenlik Eklentisi Gizlilik Politikası

**Son Güncelleme:** 15 Ekim 2025

[Click here for English version / İngilizce versiyon için tıklayın](./PRIVACY.md)

## Genel Bakış
Ahtapot Güvenlik Eklentisi, gizliliğinizi korumaya kararlıdır. Bu eklenti, güvenlik profesyonellerinin potansiyel tehditleri değerlendirmesine yardımcı olmak için üçüncü taraf güvenlik API'lerini kullanarak siber güvenlik göstergelerini (IOC'leri) analiz eder.

**Chrome Web Store'dan Yükleyin:** [https://chromewebstore.google.com/detail/ahtapot-ioc-analysis-tool/gmekhigahdiddngdhfdkeefcomcankpg](https://chromewebstore.google.com/detail/ahtapot-ioc-analysis-tool/gmekhigahdiddngdhfdkeefcomcankpg)

## Veri Toplama ve Depolama

### Yerel Olarak Sakladığımız Veriler
Tüm veriler Chrome'un güvenli depolama API'si kullanılarak **yalnızca yerel cihazınızda** saklanır. Hiçbir sunucumuz yoktur ve bize hiçbir veri iletilmez.

1. **API Anahtarları**
   - Güvenlik servisleri için API anahtarlarınız (VirusTotal, Shodan, AbuseIPDB, URLScan.io, Have I Been Pwned)
   - Chrome'un yerel depolama alanında güvenli şekilde saklanır
   - Asla sunucularımıza iletilmez (zaten sunucumuz yok)
   - Yalnızca ilgili güvenlik servisleriyle kimlik doğrulama için kullanılır

2. **Önbellekteki Analiz Sonuçları**
   - Daha önce analiz edilmiş IOC'ler (IP adresleri, domain'ler, URL'ler, dosya hash'leri, e-posta adresleri)
   - Gereksiz API çağrılarını önlemek ve rate limit'lere saygı göstermek için önbelleğe alınır
   - Kullanıcı tarafından yapılandırılan saklama süresine göre otomatik olarak silinir
   - Performansı artırır ve API kullanımını azaltır

3. **Kullanıcı Tercihleri**
   - Dil tercihi (İngilizce/Türkçe)
   - Önbellek saklama süresi (kullanıcı tarafından yapılandırılabilir)
   - Eklenti ayarları ve yapılandırmaları

### Önbellek Saklama ve Yönetimi
- **Kullanıcı Kontrolü**: Önbellekteki IOC sonuçlarının ne kadar süre saklanacağını siz yapılandırırsınız
- **Otomatik Temizlik**: Yapılandırılan eşik değerinden eski veriler otomatik olarak silinir
- **Varsayılan Süre**: 7 gün (kullanıcı tarafından ayarlanabilir)
- **Manuel Temizleme**: Ayarlardan istediğiniz zaman önbelleği manuel olarak temizleyebilirsiniz
- **Yapılandırılabilir Eşik**: Saklama süresini 1 ile 30 gün arasında ayarlayabilirsiniz

## Toplamadığımız Veriler

Ne **YAPMAYACAĞIMIZ** konusunda net olmak istiyoruz:

- ❌ Kişisel bilgi toplamıyoruz
- ❌ Seçili metin analizinin ötesinde tarama geçmişinizi takip etmiyoruz
- ❌ Sunucularımıza hiçbir veri iletmiyoruz (işleten sunucumuz yok)
- ❌ Verilerinizi kimseyle satmıyor veya paylaşmıyoruz
- ❌ Analitik veya takip servisleri kullanmıyoruz
- ❌ Reklam göstermiyoruz
- ❌ Aktivitenizi izlemiyoruz

## Eklenti Nasıl Çalışır

1. **Kullanıcı Başlatır**: Bir web sayfasında metin seçer veya sağ tıklarsınız
2. **Yerel İşleme**: Eklenti, IOC'leri (IP adresleri, domain'ler vb.) yerel olarak çıkarır
3. **API İstekleri**: SİZİN API anahtarlarınız kullanılarak güvenlik servislerine doğrudan istekler gönderilir
4. **Sonuç Gösterimi**: Analiz sonuçları yan panelde görüntülenir
5. **İsteğe Bağlı Önbellekleme**: Bu özelliği etkinleştirdiyseniz sonuçlar yerel olarak önbelleğe alınır

## Üçüncü Taraf Güvenlik Servisleri

IOC'leri analiz ettiğinizde, eklenti API anahtarlarınızı kullanarak üçüncü taraf güvenlik API'lerine **doğrudan** istekler gönderir. Biz sadece bir istemci olarak hareket ederiz:

### Desteklenen Servisler
- **VirusTotal** - Dosya, URL ve IP adresi analizi
- **Shodan** - IP adresi ve ağ cihazları analizi
- **AbuseIPDB** - IP adresi kötüye kullanım tespiti
- **URLScan.io** - URL ve web sitesi analizi
- **Have I Been Pwned** - E-posta veri ihlali kontrolü

### Üçüncü Taraf Gizlilik Politikaları
Her servisin kendi gizlilik politikası ve veri işleme uygulamaları vardır. Politikalarını incelemenizi önemle tavsiye ederiz:

- [VirusTotal Gizlilik Politikası](https://support.virustotal.com/hc/en-us/articles/115002168385-Privacy-Policy)
- [Shodan Gizlilik Politikası](https://account.shodan.io/privacy)
- [AbuseIPDB Gizlilik Politikası](https://www.abuseipdb.com/privacy)
- [URLScan Gizlilik Politikası](https://urlscan.io/about/#privacy)
- [Have I Been Pwned Gizlilik Politikası](https://haveibeenpwned.com/Privacy)

**Önemli**: Bu servisleri kontrol etmiyoruz. Onlara gönderdiğiniz veriler, bizim politikamıza değil, onların gizlilik politikalarına tabidir.

## Kontrolünüz ve Haklarınız

Verileriniz üzerinde **tam kontrole** sahipsiniz:

### Veri Yönetimi
- ✅ **Görüntüleme**: Hangi API anahtarlarının yapılandırıldığını görün
- ✅ **Değiştirme**: API anahtarlarını istediğiniz zaman değiştirin veya güncelleyin
- ✅ **Silme**: Ayarlardan API anahtarlarını kaldırın
- ✅ **Önbelleği Temizleme**: Tüm önbellekteki IOC sonuçlarını anında silin
- ✅ **Saklama Yapılandırması**: Önbelleğin ne kadar süre tutulacağını ayarlayın (1-30 gün)
- ✅ **Dışa Aktarma**: Dışa aktarma gerekmez - tüm veriler cihazınızda kalır

### Tamamen Kaldırma
Eklentiyi kaldırmak otomatik olarak şunları siler:
- Tüm API anahtarları
- Tüm önbellekteki veriler
- Tüm kullanıcı tercihleri
- Tüm eklenti verileri

Kaldırma işleminden sonra hiçbir veri kalmaz.

## Veri Güvenliği

Güvenliği ciddiye alıyoruz:

- 🔒 **Güvenli Depolama**: API anahtarları Chrome'un güvenli depolama API'si kullanılarak saklanır
- 🔒 **Şifreli İletişim**: Tüm API istekleri HTTPS kullanır
- 🔒 **İletim Yok**: Sunucularımıza hiçbir veri gönderilmez (zaten sunucumuz yok)
- 🔒 **Yerel İşleme**: Tüm IOC çıkarma işlemleri cihazınızda gerçekleşir
- 🔒 **Takip Yok**: Analitik yok, takip yok, telemetri yok
- 🔒 **Açık Kaynak**: Kod inceleme için mevcut olacak (yayınlandığında)

## İzinler Açıklaması

Eklenti aşağıdaki Chrome izinlerini gerektirir:

### storage
- **Amaç**: API anahtarlarını ve IOC sonuçlarını yerel olarak saklamak
- **Kapsam**: Yalnızca yerel cihaz
- **Erişim**: Yalnızca eklenti

### contextMenus
- **Amaç**: Sağ tıklama menüsüne "IOC Analiz Et" seçeneği eklemek
- **Kapsam**: Yalnızca sağ tıklama menüsü
- **Erişim**: Yalnızca kullanıcı tarafından başlatılır

### activeTab
- **Amaç**: Kullanıcı "IOC Analiz Et"e tıkladığında seçili metni okumak
- **Kapsam**: Yalnızca mevcut sekme, kullanıcı açıkça analizi başlattığında
- **Erişim**: Yalnızca kullanıcı tarafından başlatılır

### sidePanel
- **Amaç**: Analiz sonuçlarını yan panelde göstermek
- **Kapsam**: Yalnızca eklenti arayüzü
- **Erişim**: Yalnızca kullanıcı tarafından başlatılır

**Geniş izin yok**: Tüm web sitelerine veya tarama geçmişine erişim istemiyoruz.

## Çocukların Gizliliği

Bu eklenti güvenlik profesyonelleri için tasarlanmıştır ve 13 yaşından küçük çocuklara yönelik değildir. Bilerek çocuklardan bilgi toplamıyoruz.

## Uluslararası Kullanıcılar

Bu eklenti dünya çapında kullanılabilir. Tüm veri işleme, konumunuz ne olursa olsun cihazınızda yerel olarak gerçekleşir.

## Gizlilik Politikası Değişiklikleri

Bu gizlilik politikasını şu değişiklikleri yansıtmak için güncelleyebiliriz:
- Eklenti işlevselliği
- Yasal gereklilikler
- En iyi uygulamalar

**Bildirim**: Değişiklikler güncellenmiş "Son Güncelleme" tarihiyle bu sayfada yayınlanacaktır. Önemli değişiklikler eklenti güncelleme notlarında vurgulanacaktır.

**Versiyon Geçmişi**: [GitHub repository](https://github.com/YOUR_USERNAME/ahtapot-extension)'mizde mevcuttur.

## Veri İhlali Bildirimi

Sunucularda kullanıcı verisi toplamadığımız veya saklamadığımız için bizim tarafımızda veri ihlali riski yoktur. Veri güvenliğiniz şunlara bağlıdır:
1. Chrome'un güvenliği (yerel depolama alanınız)
2. Kullandığınız üçüncü taraf güvenlik servisleri

API anahtarlarınızın ele geçirildiğinden şüpheleniyorsanız, ilgili servis sağlayıcıları üzerinden derhal iptal edin.

## Uyumluluk

### GDPR Uyumluluğu (AB Kullanıcıları)
- **Veri Denetleyicisi**: Siz veri denetleyicisiniz (veriler cihazınızda kalır)
- **Veri İşleyicisi**: Üçüncü taraf güvenlik servisleri API isteklerinizi işler
- **Erişim Hakkı**: Eklenti ayarlarından verilerinize istediğiniz zaman erişin
- **Silme Hakkı**: Verileri istediğiniz zaman silin veya eklentiyi kaldırın
- **Taşınabilirlik Hakkı**: Veriler cihazınızda kalır
- **Veri Minimizasyonu**: Yalnızca gerekli olanı saklarız

### CCPA Uyumluluğu (Kaliforniya Kullanıcıları)
- **Veri Satışı Yok**: Kişisel bilgi satmıyoruz
- **Paylaşım Yok**: Kişisel bilgi paylaşmıyoruz
- **Erişim Hakları**: Ayarlardan tüm verilerinize erişebilirsiniz
- **Silme Hakları**: Tüm verileri istediğiniz zaman silebilirsiniz

## İletişim ve Destek

### Gizlilik Hakkında Sorular
Gizlilikle ilgili sorular için lütfen:
- [GitHub repository](https://github.com/YOUR_USERNAME/ahtapot-extension/issues)'mizde bir issue açın
- "privacy" etiketi ile işaretleyin
- Genellikle 48 saat içinde yanıt veriyoruz

### Güvenlik Endişeleri
Bir güvenlik açığı keşfederseniz:
- Kamuya açık olarak **YAYINLAMAYIN**
- E-posta: [your-email@example.com] (vermek isterseniz)
- Veya GitHub'ın özel güvenlik raporlama özelliğini kullanın

### Genel Destek
Genel sorular ve destek için:
- [SSS](https://github.com/YOUR_USERNAME/ahtapot-extension#faq)'ımıza bakın
- Bir GitHub issue açın
- Dokümantasyonu inceleyin

## Şeffaflık Taahhüdü

Tam şeffaflığa inanıyoruz:

- 🔓 **Açık Kaynak**: Kod GitHub'da yayınlanacak (hazır olduğunda)
- 🔓 **Gizli Özellik Yok**: Tüm işlevsellik belgelenmiştir
- 🔓 **Telemetri Yok**: Sıfır takip veya analitik
- 🔓 **Net İletişim**: Anlaşılır dilde gizlilik politikası
- 🔓 **Kullanıcı Kontrolü**: Neyi ne kadar saklayacağınıza siz karar verirsiniz

## Üçüncü Taraf Bağlantılar

Bu eklenti, üçüncü taraf web sitelerine bağlantılar sağlayabilir (API dokümantasyonu, servis ana sayfaları). Bu web sitelerinin gizlilik uygulamalarından sorumlu değiliz. Gizlilik politikalarını bağımsız olarak inceleyin.

## İşleme için Yasal Dayanak (GDPR)

AB'deyseniz, işleme için yasal dayanağımız:
- **Onay**: API anahtarlarını gönüllü olarak sağlarsınız
- **Meşru Menfaat**: Önbellekleme performansı artırır ve API limitlerini korur
- **Sözleşme**: Eklentiyi kullanmak bu şartları kabul etmek anlamına gelir

Onayınızı API anahtarlarını kaldırarak veya eklentiyi kaldırarak istediğiniz zaman geri çekebilirsiniz.

## Kabulünüz

Ahtapot Güvenlik Eklentisini kullanarak, bu gizlilik politikasını okuduğunuzu ve anladığınızı ve şartlarını kabul ettiğinizi onaylamış olursunuz.

---

**Özet**: Verilerinizi toplamıyoruz. Her şey cihazınızda kalıyor. Kontrol sizdedir.

Tam kaynak kodu ve güncellemeler için [GitHub repository](https://github.com/YOUR_USERNAME/ahtapot-extension)'mizi ziyaret edin.

---

*Bu gizlilik politikası 15 Ekim 2025 tarihinden itibaren geçerlidir ve gelecekte hükümlerinde yapılacak değişiklikler dışında yürürlükte kalacaktır; bu değişiklikler bu sayfada yayınlandıktan hemen sonra yürürlüğe girecektir.*
