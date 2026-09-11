import { IOCType, DetectedIOC } from '@/types/ioc';

/**
 * IOC tespit etmek için regex pattern'leri
 */
const IOC_PATTERNS: Record<IOCType, RegExp> = {
  // IPv4 adresi (0-255 arası değerler) - newline ve whitespace ile başlayabilir
  // Sondaki `\.(?!\d)`: cümleyi bitiren nokta sınır sayılır ("C2 is 8.8.8.8."),
  // ama 1.2.3.4.5 gibi daha uzun bir diziyi kırpmaya izin verilmez.
  [IOCType.IPV4]: /(?:^|[\s,;|]|[^0-9.])(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?=[\s,;|]|[^0-9.]|\.(?!\d)|$)/gm,

  // IPv6 adresi (tam ve kısaltılmış notasyon) - multiline
  [IOCType.IPV6]: /(?:^|[\s,;|]|[^:0-9a-fA-F])(?:(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}|(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}|(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}|(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:(?::[0-9a-fA-F]{1,4}){1,6}|::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}|::(?:[0-9a-fA-F]{1,4}:){0,5}:[0-9a-fA-F]{1,4})(?=[\s,;|]|[^:0-9a-fA-F]|$)/gm,

  // Domain (geçerli TLD'ler ile) - newline ve whitespace ile başlayabilir
  // Cümle sonu noktası sınırdır: "...visit evil.com." → evil.com
  [IOCType.DOMAIN]: /(?:^|[\s,;|]|[^a-zA-Z0-9.-])(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?=[\s,;|]|[^a-zA-Z0-9.-]|\.(?![a-zA-Z0-9])|$)/gm,

  // URL (http/https) - daha basit pattern
  [IOCType.URL]: /https?:\/\/[^\s<>"]+/g,

  // MD5 hash (32 hex karakter) - multiline
  [IOCType.MD5]: /(?:^|[\s,;|]|[^a-fA-F0-9])[a-fA-F0-9]{32}(?=[\s,;|]|[^a-fA-F0-9]|$)/gm,

  // SHA1 hash (40 hex karakter) - multiline
  [IOCType.SHA1]: /(?:^|[\s,;|]|[^a-fA-F0-9])[a-fA-F0-9]{40}(?=[\s,;|]|[^a-fA-F0-9]|$)/gm,

  // SHA256 hash (64 hex karakter) - multiline
  [IOCType.SHA256]: /(?:^|[\s,;|]|[^a-fA-F0-9])[a-fA-F0-9]{64}(?=[\s,;|]|[^a-fA-F0-9]|$)/gm,

  // Email adresi (RFC 5322 basitleştirilmiş) - multiline
  [IOCType.EMAIL]: /(?:^|[\s,;|]|[^a-zA-Z0-9._%+-])[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?=[\s,;|]|[^a-zA-Z0-9.-]|\.(?![a-zA-Z0-9])|$)/gm,

  // CVE numarası (CVE-YYYY-NNNNN formatı)
  [IOCType.CVE]: /CVE-\d{4}-\d{4,7}/gi,

  // Bitcoin adresi (Base58, 1 veya 3 ile başlar, veya bc1 Bech32) - multiline
  [IOCType.BITCOIN]: /(?:^|[\s,;|]|[^a-km-zA-HJ-NP-Z1-9])(?:[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})(?=[\s,;|]|[^a-km-zA-HJ-NP-Z0-9]|$)/gm,

  // Ethereum adresi (0x ile başlayan 40 hex karakter)
  [IOCType.ETHEREUM]: /0x[a-fA-F0-9]{40}/g,
};

/**
 * Refang kuralları. Sıra önemli: ayraçlı gösterimler önce açılır ki
 * hxxps[:]// → hxxps:// → https:// zinciri tamamlansın.
 */
const REFANG_RULES: Array<{ pattern: RegExp; replace: (match: RegExpMatchArray) => string }> = [
  // [.] (.) {.} ve [dot] (dot) {dot} → .  (ayraç içi boşluklara tolerans)
  { pattern: /[[({]\s*(?:\.|dot)\s*[\])}]/gi, replace: () => '.' },
  // [@] (@) {@} ve [at] (at yalnızca ayraçlı) → @
  { pattern: /[[({]\s*(?:@|at)\s*[\])}]/gi, replace: () => '@' },
  // [://] ve [:] → :// ve :
  { pattern: /\[:\/\/\]/g, replace: () => '://' },
  { pattern: /\[:\]/g, replace: () => ':' },
  // hxxp / hXXp / hxxps → http(s), fxp → ftp
  { pattern: /\bhxx(ps?):\/\//gi, replace: (m) => `htt${m[1]}://` },
  { pattern: /\bfxp:\/\//gi, replace: () => 'ftp://' },
];

/**
 * Refang edilmiş metin + kaynak metne indeks haritası.
 * `map[i]`, refang edilmiş metindeki i. karakterin ham metindeki karşılığıdır;
 * `map` dizisi metin uzunluğundan bir fazladır (bitiş konumu için).
 */
export interface RefangedText {
  text: string;
  map: number[];
}

function applyRefangRule(
  input: RefangedText,
  pattern: RegExp,
  replace: (match: RegExpMatchArray) => string
): RefangedText {
  const chars: string[] = [];
  const map: number[] = [];
  let cursor = 0;

  for (const match of input.text.matchAll(pattern)) {
    const start = match.index!;
    const end = start + match[0].length;

    for (let i = cursor; i < start; i++) {
      chars.push(input.text[i]);
      map.push(input.map[i]);
    }

    const replacement = replace(match);
    const sameLength = replacement.length === match[0].length;
    for (let i = 0; i < replacement.length; i++) {
      chars.push(replacement[i]);
      // Eşit uzunluktaysa karakter karakter eşle (hxxps:// → https://),
      // kısaldıysa tüm sonuç eşleşmenin başlangıcına bağlanır.
      map.push(sameLength ? input.map[start + i] : input.map[start]);
    }

    cursor = end;
  }

  for (let i = cursor; i < input.text.length; i++) {
    chars.push(input.text[i]);
    map.push(input.map[i]);
  }
  map.push(input.map[input.text.length]);

  return { text: chars.join(''), map };
}

/**
 * Defang edilmiş IOC gösterimlerini gerçek karakterlerine çevirir (refang) ve
 * ham metne geri dönebilmek için indeks haritasını da üretir.
 * Tehdit raporlarında IOC'ler tıklanmasın diye bozulur: secure[.]example[.]com,
 * hxxps://..., user[at]domain gibi. Tespit ve sorgulama temiz değerle yapılır.
 */
export function refangWithMap(rawText: string): RefangedText {
  let current: RefangedText = {
    text: rawText,
    map: Array.from({ length: rawText.length + 1 }, (_, i) => i),
  };

  for (const rule of REFANG_RULES) {
    current = applyRefangRule(current, rule.pattern, rule.replace);
  }

  return current;
}

/**
 * Defang edilmiş IOC gösterimlerini gerçek karakterlerine çevirir (refang).
 */
export function refangText(text: string): string {
  return refangWithMap(text).text;
}

/**
 * Highlight modunda dönen IOC: ham (refang edilmemiş) metindeki konumu ve
 * sayfada görünen ham gösterimi de taşır.
 */
export interface DetectedIOCWithSource extends DetectedIOC {
  /** Ham metindeki konum — DOM'da işaretlemek için */
  source: { start: number; end: number };
  /** Sayfada göründüğü hali (defang edilmiş olabilir) */
  raw: string;
}

interface DetectOptions {
  /**
   * Aynı değerin ikinci ve sonraki geçişlerini ele. Analiz akışında istenir
   * (aynı IOC'yi iki kez sorgulama), highlight'ta istenmez (her geçiş boyanmalı).
   */
  dedupeValues: boolean;
}

function detectIOCsCore(rawText: string, options: DetectOptions): DetectedIOCWithSource[] {
  const { text, map } = refangWithMap(rawText);
  const detected: DetectedIOCWithSource[] = [];

  // Position range tracking for O(1) duplicate detection
  const occupiedRanges: Array<{ start: number; end: number }> = [];

  // Value-based deduplication: track unique IOC values (type:value as key)
  const seenValues = new Set<string>();

  // Pre-compute URL and Email positions once - O(n) instead of O(n²)
  const urlRanges = findAllURLRanges(text);
  const emailRanges = findAllEmailRanges(text);

  // Öncelik sırasına göre IOC tiplerini tanımla
  // Daha spesifik pattern'ler önce çalışmalı (URL > DOMAIN, EMAIL > DOMAIN)
  const orderedTypes: IOCType[] = [
    IOCType.URL,        // En spesifik - önce kontrol et
    IOCType.EMAIL,      // Email'ler domain içerir ama ayrı tip
    IOCType.IPV4,
    IOCType.IPV6,
    IOCType.SHA256,     // En uzun hash
    IOCType.SHA1,       // Orta uzunluk hash
    IOCType.MD5,        // En kısa hash
    IOCType.DOMAIN,     // Genel domain - en sona
    IOCType.CVE,
    IOCType.BITCOIN,
    IOCType.ETHEREUM,
  ];

  // Her IOC tipi için pattern'i sırayla kontrol et
  orderedTypes.forEach((type) => {
    const pattern = IOC_PATTERNS[type];
    if (!pattern) return;

    const matches = text.matchAll(pattern);

    for (const match of matches) {
      let value = match[0];
      let matchStart = match.index!;

      // Lookahead/lookbehind karakterlerini temizle
      // Başındaki alfanumerik olmayan karakterleri kaldır
      const leadingMatch = value.match(/^[^a-zA-Z0-9]*/);
      if (leadingMatch && leadingMatch[0].length > 0) {
        matchStart += leadingMatch[0].length;
        value = value.substring(leadingMatch[0].length);
      }

      // Sonundaki alfanumerik olmayan karakterleri kaldır
      const trailingMatch = value.match(/[^a-zA-Z0-9:/]*$/);
      if (trailingMatch && trailingMatch[0].length > 0) {
        value = value.substring(0, value.length - trailingMatch[0].length);
      }

      if (!value) continue;

      // Normalize value for comparison (lowercase for domains/emails)
      const normalizedValue = (type === IOCType.DOMAIN || type === IOCType.EMAIL || type === IOCType.URL)
        ? value.toLowerCase()
        : value;

      // Check for duplicate value (same IOC entered multiple times)
      const valueKey = `${type}:${normalizedValue}`;
      if (options.dedupeValues && seenValues.has(valueKey)) {
        continue;
      }

      const position = {
        start: matchStart,
        end: matchStart + value.length,
      };

      // URL'leri domain'lerden ayır - O(1) lookup
      if (type === IOCType.DOMAIN && isPositionInRanges(position.start, urlRanges)) {
        continue;
      }

      // Email'leri domain'lerden ayır - O(1) lookup
      if (type === IOCType.DOMAIN && isPositionInRanges(position.start, emailRanges)) {
        continue;
      }

      // O(n) duplicate check using sorted ranges
      if (hasOverlap(position, occupiedRanges)) {
        continue;
      }

      if (isValidIOC(type, value)) {
        const source = {
          start: map[position.start],
          end: map[position.end],
        };

        detected.push({
          type,
          value,
          position,
          source,
          raw: rawText.slice(source.start, source.end),
        });

        // Mark this value as seen
        seenValues.add(valueKey);

        // Insert position in sorted order for efficient overlap detection
        insertPositionSorted(position, occupiedRanges);
      }
    }
  });

  return detected;
}

/**
 * Verilen metinde IOC'leri tespit eder
 * OPTIMIZED: O(n) complexity with position-based and value-based deduplication
 * Metin önce refang edilir; dönen value'lar sorgulanabilir temiz değerlerdir
 * (position alanları refang edilmiş metne göredir, yalnızca iç dedup'ta kullanılır).
 * @param rawText Taranacak metin
 * @returns Tespit edilen IOC'lerin listesi (unique values only)
 */
export function detectIOCs(rawText: string): DetectedIOC[] {
  return detectIOCsCore(rawText, { dedupeValues: true }).map(({ type, value, position }) => ({
    type,
    value,
    position,
  }));
}

/**
 * Sayfa üzerinde işaretleme (highlight) için IOC tespiti.
 * detectIOCs'tan iki farkı var: aynı değerin her geçişi ayrı ayrı döner ve
 * her sonuç ham metindeki konumunu taşır — DOM'da doğru yeri boyayabilmek için.
 * @param rawText Tek bir text node'un ham içeriği
 */
export function detectIOCsForHighlight(rawText: string): DetectedIOCWithSource[] {
  return detectIOCsCore(rawText, { dedupeValues: false }).sort(
    (a, b) => a.source.start - b.source.start
  );
}

/**
 * Find all URL ranges in text - O(n)
 */
function findAllURLRanges(text: string): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];
  const urlPattern = /https?:\/\/[^\s<>"]+/g;

  for (const match of text.matchAll(urlPattern)) {
    const start = match.index!;
    const end = start + match[0].length;
    ranges.push({ start, end });
  }

  return ranges;
}

/**
 * Find all email ranges in text - O(n)
 */
function findAllEmailRanges(text: string): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  for (const match of text.matchAll(emailPattern)) {
    const start = match.index!;
    const end = start + match[0].length;
    ranges.push({ start, end });
  }

  return ranges;
}

/**
 * Check if position is within any of the ranges - O(log n) with binary search
 */
function isPositionInRanges(position: number, ranges: Array<{ start: number; end: number }>): boolean {
  // Simple linear search for small arrays (faster than binary search for small n)
  for (const range of ranges) {
    if (position >= range.start && position < range.end) {
      return true;
    }
  }
  return false;
}

/**
 * Check if position overlaps with any occupied range - O(n) worst case
 */
function hasOverlap(position: { start: number; end: number }, ranges: Array<{ start: number; end: number }>): boolean {
  for (const range of ranges) {
    if (
      (position.start >= range.start && position.start < range.end) ||
      (position.end > range.start && position.end <= range.end) ||
      (position.start <= range.start && position.end >= range.end)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Insert position in sorted order - maintains sorted array for efficient searches
 */
function insertPositionSorted(position: { start: number; end: number }, ranges: Array<{ start: number; end: number }>): void {
  // Find insertion point
  let insertIndex = ranges.length;
  for (let i = 0; i < ranges.length; i++) {
    if (position.start < ranges[i].start) {
      insertIndex = i;
      break;
    }
  }
  ranges.splice(insertIndex, 0, position);
}


/**
 * IOC'nin geçerli olup olmadığını kontrol eder (ek validasyon)
 */
function isValidIOC(type: IOCType, value: string): boolean {
  switch (type) {
    case IOCType.IPV4:
      // Private IP aralıklarını filtrele (opsiyonel)
      // return !isPrivateIP(value);
      return true;

    case IOCType.DOMAIN:
      // Çok yaygın dosya uzantılarını filtrele
      const fileExtensions = ['.jpg', '.png', '.gif', '.pdf', '.doc', '.txt'];
      return !fileExtensions.some((ext) => value.toLowerCase().endsWith(ext));

    case IOCType.BITCOIN:
      // Bitcoin adres uzunluğu kontrolü
      return value.length >= 26 && value.length <= 62;

    case IOCType.ETHEREUM:
      // Ethereum adres checksumu (gelişmiş validasyon için)
      return value.length === 42;

    default:
      return true;
  }
}

/**
 * IOC tipine göre insan okunabilir açıklama döndürür
 */
export function getIOCTypeLabel(type: IOCType): string {
  const labels: Record<IOCType, string> = {
    [IOCType.IPV4]: 'IPv4 Adresi',
    [IOCType.IPV6]: 'IPv6 Adresi',
    [IOCType.DOMAIN]: 'Domain',
    [IOCType.URL]: 'URL',
    [IOCType.MD5]: 'MD5 Hash',
    [IOCType.SHA1]: 'SHA1 Hash',
    [IOCType.SHA256]: 'SHA256 Hash',
    [IOCType.EMAIL]: 'E-posta',
    [IOCType.CVE]: 'CVE',
    [IOCType.BITCOIN]: 'Bitcoin Adresi',
    [IOCType.ETHEREUM]: 'Ethereum Adresi',
  };

  return labels[type] || type;
}

/**
 * Seçili metinde IOC var mı kontrol eder
 */
export function hasIOCs(text: string): boolean {
  return detectIOCs(text).length > 0;
}
