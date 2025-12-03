import React, { useState, RefObject } from 'react';
import { Check, FileJson, FileText, Image, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { IOCAnalysisResult } from '@/types/ioc';
import './ResultCopyButtons.css';

interface ResultCopyButtonsProps {
  result: IOCAnalysisResult;
  formattedResults: string;
  cardRef?: RefObject<HTMLDivElement>;
}

export const ResultCopyButtons: React.FC<ResultCopyButtonsProps> = ({
  result,
  formattedResults,
  cardRef,
}) => {
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [copiedFormatted, setCopiedFormatted] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const copyToClipboard = async (text: string, type: 'raw' | 'formatted') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'raw') {
        setCopiedRaw(true);
        setTimeout(() => setCopiedRaw(false), 2000);
      } else {
        setCopiedFormatted(true);
        setTimeout(() => setCopiedFormatted(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopyRaw = () => {
    const rawData = JSON.stringify(result.details || {}, null, 2);
    copyToClipboard(rawData, 'raw');
  };

  const handleCopyFormatted = () => {
    copyToClipboard(formattedResults, 'formatted');
  };

  const handleExportImage = async () => {
    if (!cardRef?.current || isExporting) return;

    setIsExporting(true);
    
    try {
      const element = cardRef.current;
      
      // Hide the copy buttons temporarily for cleaner export
      const copyButtonsEl = element.querySelector('.result-copy-buttons') as HTMLElement;
      if (copyButtonsEl) {
        copyButtonsEl.style.display = 'none';
      }

      const canvas = await html2canvas(element, {
        backgroundColor: '#1a1a2e',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: Math.min(element.scrollWidth, 600), // Max width for optimal export
      });

      // Restore copy buttons
      if (copyButtonsEl) {
        copyButtonsEl.style.display = '';
      }

      // Create download link
      const link = document.createElement('a');
      const fileName = `${result.source.toLowerCase()}-${result.ioc.value.slice(0, 20)}-${Date.now()}.png`;
      link.download = fileName;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to export image:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="result-copy-buttons">
      <button
        className={`copy-btn ${copiedRaw ? 'copied' : ''}`}
        onClick={handleCopyRaw}
        title="Copy Full Raw Response"
      >
        {copiedRaw ? <Check size={14} /> : <FileJson size={14} />}
        <span>{copiedRaw ? 'Copied!' : 'Raw'}</span>
      </button>
      <button
        className={`copy-btn ${copiedFormatted ? 'copied' : ''}`}
        onClick={handleCopyFormatted}
        title="Copy Formatted Results"
      >
        {copiedFormatted ? <Check size={14} /> : <FileText size={14} />}
        <span>{copiedFormatted ? 'Copied!' : 'Results'}</span>
      </button>
      {cardRef && (
        <button
          className={`copy-btn export-btn ${isExporting ? 'exporting' : ''}`}
          onClick={handleExportImage}
          disabled={isExporting}
          title="Export as Image"
        >
          {isExporting ? <Loader2 size={14} className="spin" /> : <Image size={14} />}
          <span>{isExporting ? 'Exporting...' : 'Export'}</span>
        </button>
      )}
    </div>
  );
};

// Helper functions to format results for each provider
export const formatVirusTotalResults = (result: IOCAnalysisResult): string => {
  const { details, ioc } = result;
  if (!details) return `IOC: ${ioc.value}\nNo data available`;

  const lines: string[] = [
    `=== VirusTotal Analysis ===`,
    `IOC: ${ioc.value}`,
    `Type: ${ioc.type.toUpperCase()}`,
    ``,
    `--- Detection Summary ---`,
    `Community Score: ${(details.malicious || 0) + (details.suspicious || 0)} / ${details.total || 0}`,
    `Malicious: ${details.malicious || 0}`,
    `Suspicious: ${details.suspicious || 0}`,
    `Harmless: ${details.harmless || 0}`,
    `Undetected: ${details.undetected || 0}`,
  ];

  if (details.country) lines.push(``, `--- Location ---`, `Country: ${details.country}`);
  if (details.continent) lines.push(`Continent: ${details.continent}`);
  if (details.asn) lines.push(``, `--- Network ---`, `ASN: AS${details.asn}`);
  if (details.as_owner) lines.push(`Owner: ${details.as_owner}`);
  if (details.network) lines.push(`Network: ${details.network}`);
  if (details.reputation !== undefined) lines.push(``, `Reputation Score: ${details.reputation}`);
  if (details.last_analysis_date) lines.push(``, `Last Analysis: ${new Date(details.last_analysis_date).toLocaleString()}`);

  return lines.join('\n');
};

export const formatAbuseIPDBResults = (result: IOCAnalysisResult): string => {
  const { details, ioc } = result;
  if (!details) return `IOC: ${ioc.value}\nNo data available`;

  const lines: string[] = [
    `=== AbuseIPDB Analysis ===`,
    `IP Address: ${ioc.value}`,
    ``,
    `--- Abuse Score ---`,
    `Confidence Score: ${details.abuseConfidenceScore || 0}%`,
    `Total Reports: ${details.totalReports || 0}`,
    `Distinct Users: ${details.numDistinctUsers || 0}`,
  ];

  if (details.isp) lines.push(``, `--- Network Info ---`, `ISP: ${details.isp}`);
  if (details.domain) lines.push(`Domain: ${details.domain}`);
  if (details.countryCode) lines.push(`Country: ${details.countryCode}`);
  if (details.usageType) lines.push(`Usage Type: ${details.usageType}`);
  if (details.isWhitelisted !== undefined) lines.push(`Whitelisted: ${details.isWhitelisted ? 'Yes' : 'No'}`);
  if (details.isTor !== undefined) lines.push(`Tor Exit Node: ${details.isTor ? 'Yes' : 'No'}`);
  if (details.lastReportedAt) lines.push(``, `Last Reported: ${details.lastReportedAt}`);

  return lines.join('\n');
};

export const formatOTXResults = (result: IOCAnalysisResult): string => {
  const { details, ioc } = result;
  if (!details) return `IOC: ${ioc.value}\nNo data available`;

  const lines: string[] = [
    `=== OTX AlienVault Analysis ===`,
    `IOC: ${ioc.value}`,
    `Type: ${ioc.type.toUpperCase()}`,
    ``,
    `--- Threat Intelligence ---`,
    `Pulse Count: ${details.pulse_count || 0}`,
    `Reputation: ${details.reputation || 0}`,
  ];

  if (details.country_name) lines.push(``, `--- Location ---`, `Country: ${details.country_name}`);
  if (details.city) lines.push(`City: ${details.city}`);
  if (details.asn) lines.push(``, `--- Network ---`, `ASN: ${details.asn}`);

  if (details.pulses && details.pulses.length > 0) {
    lines.push(``, `--- Related Pulses ---`);
    details.pulses.slice(0, 5).forEach((pulse: any, i: number) => {
      lines.push(`${i + 1}. ${pulse.name || 'Unknown Pulse'}`);
    });
  }

  return lines.join('\n');
};

export const formatShodanResults = (result: IOCAnalysisResult): string => {
  const { details, ioc } = result;
  if (!details) return `IOC: ${ioc.value}\nNo data available`;

  const lines: string[] = [
    `=== Shodan Analysis ===`,
    `IP Address: ${ioc.value}`,
    ``,
  ];

  if (details.country_name) lines.push(`--- Location ---`, `Country: ${details.country_name}`);
  if (details.city) lines.push(`City: ${details.city}`);
  if (details.org) lines.push(``, `--- Organization ---`, `Organization: ${details.org}`);
  if (details.isp) lines.push(`ISP: ${details.isp}`);
  if (details.asn) lines.push(`ASN: ${details.asn}`);
  if (details.ports && details.ports.length > 0) lines.push(``, `--- Open Ports ---`, `Ports: ${details.ports.join(', ')}`);
  if (details.vulns && details.vulns.length > 0) lines.push(``, `--- Vulnerabilities ---`, `CVEs: ${details.vulns.join(', ')}`);
  if (details.hostnames && details.hostnames.length > 0) lines.push(``, `Hostnames: ${details.hostnames.join(', ')}`);
  if (details.os) lines.push(``, `Operating System: ${details.os}`);

  return lines.join('\n');
};

export const formatGreyNoiseResults = (result: IOCAnalysisResult): string => {
  const { details, ioc } = result;
  if (!details) return `IOC: ${ioc.value}\nNo data available`;

  const lines: string[] = [
    `=== GreyNoise Analysis ===`,
    `IP Address: ${ioc.value}`,
    ``,
    `--- Classification ---`,
    `Noise: ${details.noise ? 'Yes' : 'No'}`,
    `RIOT: ${details.riot ? 'Yes (Benign Service)' : 'No'}`,
  ];

  if (details.classification) lines.push(`Classification: ${details.classification}`);
  if (details.name) lines.push(`Name: ${details.name}`);
  if (details.link) lines.push(``, `More Info: ${details.link}`);
  if (details.last_seen) lines.push(`Last Seen: ${details.last_seen}`);

  return lines.join('\n');
};

export const formatARINResults = (result: IOCAnalysisResult): string => {
  const { details, ioc } = result;
  if (!details) return `IOC: ${ioc.value}\nNo data available`;

  const lines: string[] = [
    `=== ARIN WHOIS ===`,
    `IP Address: ${ioc.value}`,
    ``,
  ];

  if (details.netName) lines.push(`--- Network ---`, `Network Name: ${details.netName}`);
  if (details.netRange) lines.push(`Network Range: ${details.netRange}`);
  if (details.cidr) lines.push(`CIDR: ${details.cidr}`);
  if (details.orgName) lines.push(``, `--- Organization ---`, `Organization: ${details.orgName}`);
  if (details.orgId) lines.push(`Org ID: ${details.orgId}`);
  if (details.city) lines.push(`City: ${details.city}`);
  if (details.country) lines.push(`Country: ${details.country}`);
  if (details.registrationDate) lines.push(``, `Registered: ${details.registrationDate}`);
  if (details.updateDate) lines.push(`Updated: ${details.updateDate}`);

  return lines.join('\n');
};

export const formatMalwareBazaarResults = (result: IOCAnalysisResult): string => {
  const { details, ioc } = result;
  if (!details) return `IOC: ${ioc.value}\nNo data available`;

  const lines: string[] = [
    `=== MalwareBazaar Analysis ===`,
    `Hash: ${ioc.value}`,
    `Type: ${ioc.type.toUpperCase()}`,
    ``,
  ];

  if (details.file_name) lines.push(`--- File Info ---`, `File Name: ${details.file_name}`);
  if (details.file_type) lines.push(`File Type: ${details.file_type}`);
  if (details.file_size) lines.push(`File Size: ${details.file_size} bytes`);
  if (details.signature) lines.push(``, `--- Malware Info ---`, `Signature: ${details.signature}`);
  if (details.tags && details.tags.length > 0) lines.push(`Tags: ${details.tags.join(', ')}`);
  if (details.first_seen) lines.push(``, `First Seen: ${details.first_seen}`);
  if (details.last_seen) lines.push(`Last Seen: ${details.last_seen}`);

  return lines.join('\n');
};

export const formatURLhausResults = (result: IOCAnalysisResult): string => {
  const { details, ioc } = result;
  if (!details) return `IOC: ${ioc.value}\nNo data available`;

  const lines: string[] = [
    `=== URLhaus Analysis ===`,
    `IOC: ${ioc.value}`,
    ``,
  ];

  if (details.query_status) lines.push(`Status: ${details.query_status}`);
  if (details.url_count) lines.push(`URL Count: ${details.url_count}`);
  if (details.urlhaus_reference) lines.push(`Reference: ${details.urlhaus_reference}`);

  if (details.urls && details.urls.length > 0) {
    lines.push(``, `--- URLs ---`);
    details.urls.slice(0, 5).forEach((url: any, i: number) => {
      lines.push(`${i + 1}. ${url.url || 'Unknown'} (${url.url_status || 'Unknown status'})`);
    });
  }

  return lines.join('\n');
};

export const formatPulsediveResults = (result: IOCAnalysisResult): string => {
  const { details, ioc } = result;
  if (!details) return `IOC: ${ioc.value}\nNo data available`;

  const lines: string[] = [
    `=== Pulsedive Analysis ===`,
    `IOC: ${ioc.value}`,
    ``,
    `--- Risk Assessment ---`,
    `Risk: ${details.risk || details.risk_recommended || 'Unknown'}`,
  ];

  if (details.threats && details.threats.length > 0) {
    lines.push(``, `--- Threats ---`);
    details.threats.slice(0, 5).forEach((threat: any, i: number) => {
      lines.push(`${i + 1}. ${threat.name || threat}`);
    });
  }

  if (details.feeds && details.feeds.length > 0) {
    lines.push(``, `--- Feeds ---`);
    details.feeds.slice(0, 5).forEach((feed: any, i: number) => {
      lines.push(`${i + 1}. ${feed.name || feed}`);
    });
  }

  return lines.join('\n');
};

export const formatScamalyticsResults = (result: IOCAnalysisResult): string => {
  const { details, ioc } = result;
  if (!details) return `IOC: ${ioc.value}\nNo data available`;

  const lines: string[] = [
    `=== Scamalytics Analysis ===`,
    `IP Address: ${ioc.value}`,
    ``,
    `--- Fraud Score ---`,
    `Score: ${details.score || 0}`,
    `Risk: ${details.risk || 'Unknown'}`,
  ];

  if (details.isp_score !== undefined) lines.push(`ISP Score: ${details.isp_score}`);
  if (details.is_blacklisted !== undefined) lines.push(``, `Blacklisted: ${details.is_blacklisted ? 'Yes' : 'No'}`);

  if (details.proxy_info) {
    const proxy = details.proxy_info;
    lines.push(``, `--- Proxy Detection ---`);
    if (proxy.is_vpn !== undefined) lines.push(`VPN: ${proxy.is_vpn ? 'Yes' : 'No'}`);
    if (proxy.is_tor !== undefined) lines.push(`Tor: ${proxy.is_tor ? 'Yes' : 'No'}`);
    if (proxy.is_datacenter !== undefined) lines.push(`Datacenter: ${proxy.is_datacenter ? 'Yes' : 'No'}`);
    if (proxy.is_public_proxy !== undefined) lines.push(`Public Proxy: ${proxy.is_public_proxy ? 'Yes' : 'No'}`);
  }

  return lines.join('\n');
};

// Generic formatter for unknown providers
export const formatGenericResults = (result: IOCAnalysisResult): string => {
  const { details, ioc, source } = result;
  if (!details) return `IOC: ${ioc.value}\nNo data available`;

  const lines: string[] = [
    `=== ${source} Analysis ===`,
    `IOC: ${ioc.value}`,
    `Type: ${ioc.type.toUpperCase()}`,
    `Status: ${result.status}`,
    ``,
  ];

  // Add all details
  Object.entries(details).forEach(([key, value]) => {
    if (value !== null && value !== undefined && typeof value !== 'object') {
      lines.push(`${key}: ${value}`);
    }
  });

  return lines.join('\n');
};

