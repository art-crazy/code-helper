/**
 * Code Formatter Utilities
 *
 * Утилиты для форматирования и обработки кода
 */

/**
 * Подсвечивает синтаксис кода (базовая реализация)
 * @param code - Код для подсветки
 * @param language - Язык программирования
 * @returns HTML с подсветкой
 */
export function highlightCode(code: string, language: string = 'javascript'): string {
  // Базовая подсветка без внешних библиотек
  const keywords: Record<string, string[]> = {
    javascript: ['function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'async', 'await'],
    python: ['def', 'class', 'import', 'from', 'return', 'if', 'else', 'elif', 'for', 'while', 'try', 'except', 'with', 'as'],
    java: ['public', 'private', 'class', 'static', 'void', 'return', 'if', 'else', 'for', 'while', 'new', 'try', 'catch'],
  };

  let highlighted = code;
  const langKeywords = keywords[language] || keywords.javascript;

  // Подсвечиваем ключевые слова
  langKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'g');
    highlighted = highlighted.replace(regex, `<span class="text-blue-600 font-semibold">${keyword}</span>`);
  });

  // Подсвечиваем строки
  highlighted = highlighted.replace(/(['"`])(.*?)\1/g, '<span class="text-green-600">$&</span>');

  // Подсвечиваем комментарии
  highlighted = highlighted.replace(/(\/\/.*$)/gm, '<span class="text-gray-500 italic">$1</span>');
  highlighted = highlighted.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="text-gray-500 italic">$1</span>');

  return highlighted;
}

/**
 * Обрезает код до определенной длины
 * @param code - Исходный код
 * @param maxLength - Максимальная длина
 * @returns Обрезанный код
 */
export function truncateCode(code: string, maxLength: number = 1000): string {
  if (code.length <= maxLength) return code;

  return code.substring(0, maxLength) + '\n... (truncated)';
}

/**
 * Подсчитывает строки кода
 * @param code - Код
 * @returns Количество строк
 */
export function countLines(code: string): number {
  return code.split('\n').length;
}

/**
 * Определяет сложность кода (базовая метрика)
 * @param code - Код для анализа
 * @returns Уровень сложности
 */
export function estimateComplexity(code: string): 'low' | 'medium' | 'high' {
  const lines = countLines(code);
  const cyclomaticKeywords = (code.match(/\b(if|else|for|while|switch|case|catch)\b/g) || []).length;

  if (lines < 20 && cyclomaticKeywords < 5) return 'low';
  if (lines < 50 && cyclomaticKeywords < 15) return 'medium';
  return 'high';
}

/**
 * Извлекает имя функции/класса из кода
 * @param code - Код
 * @returns Имя или null
 */
export function extractName(code: string): string | null {
  // Функции
  const funcMatch = code.match(/function\s+(\w+)/);
  if (funcMatch) return funcMatch[1];

  // Стрелочные функции
  const arrowMatch = code.match(/const\s+(\w+)\s*=/);
  if (arrowMatch) return arrowMatch[1];

  // Классы
  const classMatch = code.match(/class\s+(\w+)/);
  if (classMatch) return classMatch[1];

  return null;
}

/**
 * Форматирует отступы в коде
 * @param code - Код
 * @param spaces - Количество пробелов для отступа
 * @returns Отформатированный код
 */
export function normalizeIndentation(code: string, spaces: number = 2): string {
  const lines = code.split('\n');
  const minIndent = Math.min(
    ...lines
      .filter(line => line.trim())
      .map(line => line.match(/^\s*/)?.[0].length || 0)
  );

  return lines
    .map(line => line.substring(minIndent))
    .join('\n');
}
