import { DetectedIOC, IOCAnalysisResult, APIProvider, IOCType } from '@/types/ioc';

/**
 * API Service Layer
 * Farklı güvenlik araçlarının API'leriyle iletişim kurar
 */

export class APIService {
  private apiKeys: Record<string, string>;

  constructor(apiKeys: Record<string, string>) {
    this.apiKeys = apiKeys;
  }

  /**
   * IOC'yi analiz eder (tüm uygun API'leri kullanır)
   */
  async analyzeIOC(ioc: DetectedIOC): Promise<IOCAnalysisResult[]> {
    const results: IOCAnalysisResult[] = [];

    // IOC tipine göre hangi API'leri kullanacağımızı belirle
    const apis = this.selectAPIsForIOC(ioc);

    // Her API için paralel olarak analiz yap
    const promises = apis.map((api) => this.callAPI(api, ioc));
    const apiResults = await Promise.allSettled(promises);

    // Sonuçları topla
    apiResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          ioc,
          source: apis[index],
          status: 'error',
          error: result.reason.message,
          timestamp: Date.now(),
        });
      }
    });

    return results;
  }

  /**
   * IOC tipine göre kullanılacak API'leri seçer
   */
  private selectAPIsForIOC(ioc: DetectedIOC): APIProvider[] {
    const apis: APIProvider[] = [];

    switch (ioc.type) {
      case IOCType.IPV4:
      case IOCType.IPV6:
        if (this.apiKeys[APIProvider.VIRUSTOTAL]) apis.push(APIProvider.VIRUSTOTAL);
        if (this.apiKeys[APIProvider.SHODAN]) apis.push(APIProvider.SHODAN);
        if (this.apiKeys[APIProvider.ABUSEIPDB]) apis.push(APIProvider.ABUSEIPDB);
        break;

      case IOCType.DOMAIN:
      case IOCType.URL:
        if (this.apiKeys[APIProvider.VIRUSTOTAL]) apis.push(APIProvider.VIRUSTOTAL);
        if (this.apiKeys[APIProvider.URLSCAN]) apis.push(APIProvider.URLSCAN);
        break;

      case IOCType.MD5:
      case IOCType.SHA1:
      case IOCType.SHA256:
        if (this.apiKeys[APIProvider.VIRUSTOTAL]) apis.push(APIProvider.VIRUSTOTAL);
        break;

      case IOCType.EMAIL:
        if (this.apiKeys[APIProvider.HIBP]) apis.push(APIProvider.HIBP);
        break;

      case IOCType.BITCOIN:
      case IOCType.ETHEREUM:
        if (this.apiKeys[APIProvider.BLOCKCHAIN]) apis.push(APIProvider.BLOCKCHAIN);
        break;
    }

    return apis;
  }

  /**
   * Spesifik bir API'yi çağırır
   */
  private async callAPI(
    provider: APIProvider,
    ioc: DetectedIOC
  ): Promise<IOCAnalysisResult> {
    switch (provider) {
      case APIProvider.VIRUSTOTAL:
        return this.callVirusTotal(ioc);
      case APIProvider.SHODAN:
        return this.callShodan(ioc);
      case APIProvider.ABUSEIPDB:
        return this.callAbuseIPDB(ioc);
      case APIProvider.URLSCAN:
        return this.callURLScan(ioc);
      case APIProvider.HIBP:
        return this.callHIBP(ioc);
      case APIProvider.BLOCKCHAIN:
        return this.callBlockchain(ioc);
      default:
        throw new Error(`Desteklenmeyen API: ${provider}`);
    }
  }

  /**
   * VirusTotal API
   */
  private async callVirusTotal(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    const apiKey = this.apiKeys[APIProvider.VIRUSTOTAL];
    if (!apiKey) {
      throw new Error('VirusTotal API anahtarı yapılandırılmamış');
    }

    // API endpoint'ini belirle
    let endpoint = '';
    let identifier = ioc.value;

    switch (ioc.type) {
      case IOCType.IPV4:
      case IOCType.IPV6:
        endpoint = `https://www.virustotal.com/api/v3/ip_addresses/${identifier}`;
        break;
      case IOCType.DOMAIN:
        endpoint = `https://www.virustotal.com/api/v3/domains/${identifier}`;
        break;
      case IOCType.URL:
        // URL'i base64 encode et (VirusTotal gereksinimidir)
        identifier = btoa(identifier).replace(/=/g, '');
        endpoint = `https://www.virustotal.com/api/v3/urls/${identifier}`;
        break;
      case IOCType.MD5:
      case IOCType.SHA1:
      case IOCType.SHA256:
        endpoint = `https://www.virustotal.com/api/v3/files/${identifier}`;
        break;
      default:
        throw new Error('VirusTotal bu IOC tipini desteklemiyor');
    }

    try {
      const response = await fetch(endpoint, {
        headers: {
          'x-apikey': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`VirusTotal API hatası: ${response.status}`);
      }

      const data = await response.json();

      // Sonucu yorumla
      const stats = data.data.attributes.last_analysis_stats;
      const malicious = stats.malicious || 0;
      const suspicious = stats.suspicious || 0;
      const total = Object.values(stats).reduce((a: any, b: any) => (a as number) + (b as number), 0) as number;

      let status: IOCAnalysisResult['status'] = 'unknown';
      if (malicious > 5) status = 'malicious';
      else if (malicious > 0 || suspicious > 0) status = 'suspicious';
      else if (total > 0) status = 'safe';

      return {
        ioc,
        source: 'VirusTotal',
        status,
        details: {
          malicious,
          suspicious,
          total,
          positives: `${malicious}/${total}`,
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`VirusTotal sorgusu başarısız: ${error}`);
    }
  }

  /**
   * Shodan API
   */
  private async callShodan(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    const apiKey = this.apiKeys[APIProvider.SHODAN];
    if (!apiKey) {
      throw new Error('Shodan API anahtarı yapılandırılmamış');
    }

    try {
      const response = await fetch(
        `https://api.shodan.io/shodan/host/${ioc.value}?key=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Shodan API hatası: ${response.status}`);
      }

      const data = await response.json();

      return {
        ioc,
        source: 'Shodan',
        status: 'unknown',
        details: {
          ports: data.ports || [],
          services: data.data?.map((d: any) => d.product).filter(Boolean) || [],
          organization: data.org || 'Bilinmiyor',
          country: data.country_name || 'Bilinmiyor',
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`Shodan sorgusu başarısız: ${error}`);
    }
  }

  /**
   * AbuseIPDB API
   */
  private async callAbuseIPDB(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    const apiKey = this.apiKeys[APIProvider.ABUSEIPDB];
    if (!apiKey) {
      throw new Error('AbuseIPDB API anahtarı yapılandırılmamış');
    }

    try {
      const response = await fetch(
        `https://api.abuseipdb.com/api/v2/check?ipAddress=${ioc.value}`,
        {
          headers: {
            Key: apiKey,
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`AbuseIPDB API hatası: ${response.status}`);
      }

      const data = await response.json();
      const abuseScore = data.data.abuseConfidenceScore;

      let status: IOCAnalysisResult['status'] = 'safe';
      if (abuseScore > 75) status = 'malicious';
      else if (abuseScore > 25) status = 'suspicious';

      return {
        ioc,
        source: 'AbuseIPDB',
        status,
        details: {
          abuseScore,
          totalReports: data.data.totalReports,
          country: data.data.countryName,
          isWhitelisted: data.data.isWhitelisted,
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`AbuseIPDB sorgusu başarısız: ${error}`);
    }
  }

  /**
   * URLScan.io API
   */
  private async callURLScan(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    const apiKey = this.apiKeys[APIProvider.URLSCAN];
    if (!apiKey) {
      throw new Error('URLScan.io API anahtarı yapılandırılmamış');
    }

    // URLScan önce submission, sonra result alır
    try {
      // 1. URL'i submit et
      const submitResponse = await fetch('https://urlscan.io/api/v1/scan/', {
        method: 'POST',
        headers: {
          'API-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: ioc.value,
          visibility: 'private',
        }),
      });

      if (!submitResponse.ok) {
        throw new Error(`URLScan submission hatası: ${submitResponse.status}`);
      }

      const submitData = await submitResponse.json();

      // 2. Sonuçları bekle (birkaç saniye)
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // 3. Sonuçları al
      const resultResponse = await fetch(submitData.api, {
        headers: {
          'API-Key': apiKey,
        },
      });

      if (!resultResponse.ok) {
        // Henüz hazır değilse pending olarak dön
        return {
          ioc,
          source: 'URLScan.io',
          status: 'unknown',
          details: {
            message: 'Tarama devam ediyor...',
            uuid: submitData.uuid,
          },
          timestamp: Date.now(),
        };
      }

      const resultData = await resultResponse.json();

      // Verdicts'ten tehlike durumunu belirle
      const verdicts = resultData.verdicts || {};
      const overallScore = verdicts.overall?.score || 0;

      let status: IOCAnalysisResult['status'] = 'safe';
      if (overallScore > 50) status = 'malicious';
      else if (overallScore > 0) status = 'suspicious';

      return {
        ioc,
        source: 'URLScan.io',
        status,
        details: {
          score: overallScore,
          malicious: verdicts.overall?.malicious || false,
          screenshot: resultData.task?.screenshotURL,
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`URLScan sorgusu başarısız: ${error}`);
    }
  }

  /**
   * Have I Been Pwned API
   */
  private async callHIBP(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    const apiKey = this.apiKeys[APIProvider.HIBP];
    if (!apiKey) {
      throw new Error('HIBP API anahtarı yapılandırılmamış');
    }

    try {
      const response = await fetch(
        `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(ioc.value)}`,
        {
          headers: {
            'hibp-api-key': apiKey,
          },
        }
      );

      if (response.status === 404) {
        // Veri ihlali bulunamadı
        return {
          ioc,
          source: 'Have I Been Pwned',
          status: 'safe',
          details: {
            message: 'Bu e-posta adresi bilinen veri ihlallerinde bulunmamaktadır.',
          },
          timestamp: Date.now(),
        };
      }

      if (!response.ok) {
        throw new Error(`HIBP API hatası: ${response.status}`);
      }

      const breaches = await response.json();

      return {
        ioc,
        source: 'Have I Been Pwned',
        status: 'malicious',
        details: {
          breachCount: breaches.length,
          breaches: breaches.map((b: any) => b.Name),
          message: `Bu e-posta ${breaches.length} veri ihlalinde tespit edilmiştir.`,
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new Error(`HIBP sorgusu başarısız: ${error}`);
    }
  }

  /**
   * Blockchain API (kripto para adresleri)
   */
  private async callBlockchain(ioc: DetectedIOC): Promise<IOCAnalysisResult> {
    // Blockchain.info API key gerektirmez (public API)
    try {
      if (ioc.type === IOCType.BITCOIN) {
        const response = await fetch(
          `https://blockchain.info/rawaddr/${ioc.value}`
        );

        if (!response.ok) {
          throw new Error(`Blockchain API hatası: ${response.status}`);
        }

        const data = await response.json();

        return {
          ioc,
          source: 'Blockchain.info',
          status: 'unknown',
          details: {
            balance: data.final_balance / 100000000, // Satoshi'den BTC'ye
            totalReceived: data.total_received / 100000000,
            totalSent: data.total_sent / 100000000,
            transactionCount: data.n_tx,
          },
          timestamp: Date.now(),
        };
      } else {
        // Ethereum için farklı API kullanılabilir (örn: Etherscan)
        throw new Error('Ethereum analizi henüz desteklenmiyor');
      }
    } catch (error) {
      throw new Error(`Blockchain sorgusu başarısız: ${error}`);
    }
  }
}
