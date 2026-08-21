# Releasing

Release süreci tamamen otomatiktir; `main`'e merge edilen her sürüm bump'ı
kendini yayınlar.

## Akış

1. Feature branch'inde çalış; `package.json` **ve** `src/manifest.json`
   sürümlerini birlikte bump'la (CI eşitliklerini doğrular, Version Check
   PR'da bump'ı zorunlu kılar).
2. PR aç → CI (typecheck + build + dev zip artifact) ve Version Check koşar.
3. Merge → `release.yml`:
   - Sürüm için tag yoksa: build alır, `ahtapot-<ver>-chrome.zip` (dist
     içeriği, manifest zip kökünde) ve `ahtapot-<ver>-sources.zip`
     (git archive) üretir,
   - `v<ver>` tag'i + GitHub Release'i oluşturur (otomatik release notes),
   - `BPP_KEYS` secret'ı tanımlıysa zip'i Chrome Web Store'a gönderir.
   - Tag zaten varsa (ör. docs-only commit) hiçbir şey yayınlamaz.

## Mağaza gönderimi başarısız olursa

Tag ve GitHub Release oluşmuş ama store yüklemesi hata vermişse sürümü
bump'lama; **Store Publish** workflow'unu (Actions → Store Publish →
Run workflow) ilgili tag ile elle tetikle. Mevcut release'in zip'ini indirip
yeniden gönderir.

## BPP_KEYS secret'ı

[PlasmoHQ/bpp](https://github.com/PlasmoHQ/bpp) Chrome Web Store API ile
yükler. Repo Settings → Secrets and variables → Actions altında `BPP_KEYS`
adında şu JSON'u tanımla:

```json
{
  "$schema": "https://raw.githubusercontent.com/PlasmoHQ/bpp/v3/keys.schema.json",
  "chrome": {
    "clientId": "<Google Cloud OAuth client ID>",
    "clientSecret": "<OAuth client secret>",
    "refreshToken": "<refresh token>",
    "extId": "gmekhigahdiddngdhfdkeefcomcankpg"
  }
}
```

Credential'ları almak için: Google Cloud Console'da bir proje aç, **Chrome
Web Store API**'yi etkinleştir, OAuth consent + Desktop app client oluştur ve
refresh token üret (adım adım rehber:
<https://github.com/PlasmoHQ/chrome-webstore-api/blob/main/token.md>).

`BPP_KEYS` tanımlı değilken release yine tag + GitHub Release üretir; yalnızca
mağaza adımı atlanır.
