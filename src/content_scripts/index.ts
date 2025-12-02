/**
 * Content Script - Детектор кода на странице
 *
 * Этот скрипт внедряется на все веб-страницы и:
 * 1. Автоматически определяет наличие кода на странице
 * 2. Анализирует элементы <pre>, <code>, CodeMirror, Monaco Editor
 * 3. Определяет язык программирования
 * 4. Отправляет информацию в popup через Chrome API
 * 5. Слушает сообщения от popup для повторного анализа
 */

import type { CodeBlock, PageAnalysis, PageInfo, ChromeMessage, ChromeMessageResponse } from '../types';

// Расширяем типы для CodeMirror и Monaco
declare global {
  interface Element {
    CodeMirror?: {
      getValue(): string;
    };
  }
  interface Window {
    monaco?: {
      editor?: {
        getModels(): Array<{ getValue(): string }>;
      };
    };
  }
}

/**
 * Основной класс для детекции кода на странице
 */
class CodeDetector {
  private codeSelectors: string[];
  private programmingKeywords: string[];

  constructor() {
    // Селекторы для поиска кодовых блоков
    this.codeSelectors = [
      'pre code',
      'pre',
      '.CodeMirror',
      '.monaco-editor',
      '[class*="code"]',
      '[class*="snippet"]',
      'div[contenteditable="true"]',
      'textarea[class*="code"]',
    ];

    // Ключевые слова программирования для определения кода
    this.programmingKeywords = [
      'function', 'const', 'let', 'var', 'class', 'import', 'export',
      'return', 'if', 'else', 'for', 'while', 'switch', 'case',
      'def', 'print', 'lambda', 'async', 'await', 'yield',
      'public', 'private', 'protected', 'static', 'void',
      '{', '}', '=>', '==', '===', '!=', '!==',
    ];
  }

  /**
   * Проверяет, содержит ли текст признаки кода
   * @param text - Текст для анализа
   * @returns true если похоже на код
   */
  looksLikeCode(text: string): boolean {
    if (!text || text.length < 10) return false;

    // Подсчет ключевых слов программирования
    const keywordCount = this.programmingKeywords.filter(keyword =>
      text.includes(keyword)
    ).length;

    // Проверка на специальные символы
    const specialChars = ['{', '}', ';', '(', ')', '[', ']'];
    const specialCharCount = specialChars.filter(char =>
      text.includes(char)
    ).length;

    // Проверка на отступы (характерно для кода)
    const lines = text.split('\n');
    const indentedLines = lines.filter(line =>
      line.startsWith('  ') || line.startsWith('\t')
    ).length;

    return keywordCount >= 2 || specialCharCount >= 3 || indentedLines >= 2;
  }

  /**
   * Извлекает текст кода из элемента
   * @param element - DOM элемент
   * @returns Текст кода
   */
  extractCodeText(element: Element): string {
    // Для CodeMirror
    if (element.classList.contains('CodeMirror')) {
      const cmInstance = element.CodeMirror;
      if (cmInstance) return cmInstance.getValue();
    }

    // Для Monaco Editor
    if (element.classList.contains('monaco-editor')) {
      const model = window.monaco?.editor?.getModels()?.[0];
      if (model) return model.getValue();
    }

    // Обычный текст
    return element.textContent || (element as HTMLElement).innerText || '';
  }

  /**
   * Находит все блоки кода на странице
   * @returns Массив объектов с информацией о коде
   */
  detectCodeBlocks(): CodeBlock[] {
    const codeBlocks: CodeBlock[] = [];

    this.codeSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);

        elements.forEach((element, index) => {
          const text = this.extractCodeText(element);

          if (this.looksLikeCode(text)) {
            codeBlocks.push({
              selector: selector,
              index: index,
              text: text.substring(0, 5000), // Ограничение для производительности
              language: this.detectLanguage(text),
              position: this.getElementPosition(element),
            });
          }
        });
      } catch (error) {
        console.warn(`Error processing selector ${selector}:`, error);
      }
    });

    return codeBlocks;
  }

  /**
   * Определяет язык программирования по содержимому
   * @param code - Код для анализа
   * @returns Название языка
   */
  detectLanguage(code: string): string {
    const languagePatterns: Record<string, RegExp> = {
      javascript: /\b(function|const|let|var|=>|console\.log)\b/,
      python: /\b(def|import|print|lambda|self|__init__)\b/,
      java: /\b(public|private|class|static|void|System\.out)\b/,
      cpp: /\b(#include|cout|cin|std::)\b/,
      csharp: /\b(using|namespace|public|private|class|void)\b/,
      html: /<[a-z][\s\S]*>/i,
      css: /[.#][a-zA-Z][\s\S]*\{[\s\S]*\}/,
      sql: /\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE)\b/i,
    };

    for (const [language, pattern] of Object.entries(languagePatterns)) {
      if (pattern.test(code)) return language;
    }

    return 'unknown';
  }

  /**
   * Получает позицию элемента на странице
   * @param element - DOM элемент
   * @returns Координаты элемента
   */
  getElementPosition(element: Element): CodeBlock['position'] {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height,
    };
  }

  /**
   * Получает выделенный текст пользователем
   * @returns Выделенный текст или null
   */
  getSelectedText(): string | null {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    return text && text.length > 10 ? text : null;
  }

  /**
   * Анализирует всю страницу и собирает контекст
   * @returns Полная информация о странице
   */
  analyzePage(): PageAnalysis {
    const codeBlocks = this.detectCodeBlocks();
    const selectedText = this.getSelectedText();
    const pageTitle = document.title;
    const pageUrl = window.location.href;

    // Определяем, является ли страница сайтом для программирования
    const isProgrammingSite = this.isProgrammingSite(pageUrl);

    return {
      hasCode: codeBlocks.length > 0 || (selectedText !== null && this.looksLikeCode(selectedText)),
      codeBlocks: codeBlocks,
      selectedText: selectedText,
      pageInfo: {
        title: pageTitle,
        url: pageUrl,
        isProgrammingSite: isProgrammingSite,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Проверяет, является ли сайт программистским
   * @param url - URL страницы
   * @returns true если это программистский сайт
   */
  isProgrammingSite(url: string): boolean {
    const programmingSites = [
      'leetcode.com',
      'hackerrank.com',
      'codewars.com',
      'codeforces.com',
      'topcoder.com',
      'stackoverflow.com',
      'github.com',
      'gitlab.com',
      'replit.com',
      'codepen.io',
      'jsfiddle.net',
      'codesandbox.io',
    ];

    return programmingSites.some(site => url.includes(site));
  }
}

// ============================================================================
// Инициализация и обработчики событий
// ============================================================================

const detector = new CodeDetector();
let lastAnalysis: PageAnalysis | null = null;

/**
 * Выполняет анализ страницы и сохраняет результат
 */
function performAnalysis(): PageAnalysis {
  lastAnalysis = detector.analyzePage();

  // Сохраняем в chrome.storage для доступа из popup
  chrome.storage.local.set({
    pageAnalysis: lastAnalysis
  });

  return lastAnalysis;
}

/**
 * Обработчик сообщений от popup
 */
chrome.runtime.onMessage.addListener((
  request: ChromeMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: ChromeMessageResponse) => void
) => {
  if (request.action === 'analyzePage') {
    const analysis = performAnalysis();
    sendResponse({ success: true, data: analysis });
  }

  if (request.action === 'getSelectedText') {
    const selectedText = detector.getSelectedText();
    sendResponse({ success: true, data: { text: selectedText } });
  }

  return true; // Асинхронный ответ
});

/**
 * Слушатель изменений в выделении текста
 */
document.addEventListener('selectionchange', () => {
  const selectedText = detector.getSelectedText();

  if (selectedText && detector.looksLikeCode(selectedText)) {
    chrome.storage.local.set({
      selectedCode: selectedText
    });
  }
});

/**
 * Наблюдатель за изменениями DOM (для динамических сайтов)
 */
const observer = new MutationObserver((mutations) => {
  // Дебаунсинг для оптимизации
  clearTimeout((window as any).codeDetectorTimeout);

  (window as any).codeDetectorTimeout = setTimeout(() => {
    performAnalysis();
  }, 1000);
});

// Запускаем наблюдение за изменениями
observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// Начальный анализ при загрузке страницы
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', performAnalysis);
} else {
  performAnalysis();
}

console.log('🚀 Code Helper: Content script initialized');
