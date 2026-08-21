/**
 * Turkiye SGB (Siber Güvenlik Başkanlığı / TR-CERT) types
 * Public malicious-link feed: https://siberguvenlik.gov.tr/api/
 */

/** One record from GET /api/address/index */
export interface SGBRecord {
  id: number;
  url: string;
  type: string;
  /** Category code: PH, BP, MD, MI, MU, MC, CA */
  desc: string;
  /** Connection code: AC, BC, EK, MC, MF, MM, OT, PH */
  connectiontype?: string;
  /** Source code: US, SO, RS, IH, SB */
  source?: string;
  date?: string;
  criticality_level?: number;
}

export interface SGBResponse {
  models?: SGBRecord[];
}

/** A record mapped for display */
export interface SGBEntry {
  id: number;
  value: string;
  recordType: string;
  category: string;
  categoryDesc?: string;
  connection?: string;
  source?: string;
  date?: string;
  criticality?: number;
  detailUrl?: string;
}
