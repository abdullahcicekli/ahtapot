import { DetectedIOC, IOCAnalysisResult } from './ioc';

/**
 * Mesaj türleri (background <-> content script iletişimi)
 */
export enum MessageType {
  ANALYZE_IOC = 'ANALYZE_IOC',
  ANALYSIS_RESULT = 'ANALYSIS_RESULT',
  OPEN_SIDEPANEL = 'OPEN_SIDEPANEL',
  GET_API_KEYS = 'GET_API_KEYS',
}

/**
 * IOC analiz isteği mesajı
 */
export interface AnalyzeIOCMessage {
  type: MessageType.ANALYZE_IOC;
  payload: {
    iocs: DetectedIOC[];
  };
}

/**
 * Analiz sonucu mesajı
 */
export interface AnalysisResultMessage {
  type: MessageType.ANALYSIS_RESULT;
  payload: {
    results: IOCAnalysisResult[];
  };
}

/**
 * Side panel açma mesajı
 */
export interface OpenSidePanelMessage {
  type: MessageType.OPEN_SIDEPANEL;
  payload: {
    iocs: DetectedIOC[];
  };
}

/**
 * Tüm mesaj tipleri
 */
export type ExtensionMessage =
  | AnalyzeIOCMessage
  | AnalysisResultMessage
  | OpenSidePanelMessage;
