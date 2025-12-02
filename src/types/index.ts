/**
 * TypeScript Type Definitions
 *
 * Общие типы для приложения
 */

/**
 * Анализ кодового блока
 */
export interface CodeBlock {
  selector: string;
  index: number;
  text: string;
  language: string;
  position: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

/**
 * Информация о странице
 */
export interface PageInfo {
  title: string;
  url: string;
  isProgrammingSite: boolean;
}

/**
 * Результат анализа страницы
 */
export interface PageAnalysis {
  hasCode: boolean;
  codeBlocks: CodeBlock[];
  selectedText: string | null;
  pageInfo: PageInfo;
  timestamp: number;
}

/**
 * Опции для анализа кода
 */
export interface AnalysisOptions {
  language?: string;
  context?: string;
  analysisType?: 'explain' | 'solve' | 'optimize' | 'debug';
}

/**
 * Ответ от Gemini API
 */
export interface GeminiResponse {
  success: boolean;
  text: string | null;
  error?: string;
  fullResponse?: any;
}

/**
 * Настройки расширения
 */
export interface ExtensionSettings {
  apiKey?: string;
  autoAnalyze?: boolean;
  theme?: 'light' | 'dark';
}

/**
 * Сообщения между компонентами расширения
 */
export type ChromeMessage =
  | { action: 'analyzePage' }
  | { action: 'getSelectedText' }
  | { action: 'ping' };

/**
 * Ответ на сообщение
 */
export interface ChromeMessageResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
