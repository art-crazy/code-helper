/**
 * Gemini API Service
 *
 * Сервис для взаимодействия с Google Gemini API
 * Предоставляет функции для анализа кода и получения подсказок
 */

import type { AnalysisOptions, GeminiResponse } from '../types';

// Константы для API
const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const MODEL_NAME = 'gemini-pro';

/**
 * Класс для работы с Gemini API
 */
class GeminiService {
  private apiKey: string | null = null;
  private model: string = MODEL_NAME;
  private maxRetries: number = 3;
  private requestTimeout: number = 30000; // 30 секунд

  /**
   * Устанавливает API ключ
   * @param key - API ключ от Google AI Studio
   */
  setApiKey(key: string): void {
    this.apiKey = key;
  }

  /**
   * Получает API ключ из chrome.storage
   * @returns API ключ или null
   */
  async getApiKey(): Promise<string | null> {
    if (this.apiKey) return this.apiKey;

    try {
      const result = await chrome.storage.sync.get(['geminiApiKey']);
      this.apiKey = result.geminiApiKey || null;
      return this.apiKey;
    } catch (error) {
      console.error('Error getting API key:', error);
      return null;
    }
  }

  /**
   * Сохраняет API ключ в chrome.storage
   * @param key - API ключ
   */
  async saveApiKey(key: string): Promise<boolean> {
    try {
      await chrome.storage.sync.set({ geminiApiKey: key });
      this.apiKey = key;
      return true;
    } catch (error) {
      console.error('Error saving API key:', error);
      return false;
    }
  }

  /**
   * Проверяет валидность API ключа
   * @param key - API ключ для проверки
   * @returns true если ключ валидный
   */
  async validateApiKey(key: string): Promise<boolean> {
    try {
      const response = await this.makeRequest(key, 'Test connection');
      return response.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * Выполняет запрос к Gemini API
   * @param apiKey - API ключ
   * @param prompt - Промпт для модели
   * @param retryCount - Текущая попытка
   * @returns Ответ от API
   */
  async makeRequest(
    apiKey: string,
    prompt: string,
    retryCount: number = 0
  ): Promise<GeminiResponse> {
    const url = `${GEMINI_API_BASE_URL}/models/${this.model}:generateContent?key=${apiKey}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_NONE'
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_NONE'
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_NONE'
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_NONE'
            }
          ]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Извлекаем текст из ответа
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('No text in response');
      }

      return {
        success: true,
        text: text,
        fullResponse: data
      };

    } catch (error: any) {
      console.error(`Request failed (attempt ${retryCount + 1}):`, error);

      // Повторная попытка при ошибке
      if (retryCount < this.maxRetries && error.name !== 'AbortError') {
        await this.delay(1000 * (retryCount + 1)); // Экспоненциальная задержка
        return this.makeRequest(apiKey, prompt, retryCount + 1);
      }

      return {
        success: false,
        error: error.message || 'Unknown error',
        text: null
      };
    }
  }

  /**
   * Задержка для повторных попыток
   * @param ms - Миллисекунды
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Анализирует код и возвращает подсказки
   * @param code - Код для анализа
   * @param options - Дополнительные параметры
   * @returns Ответ от AI
   */
  async analyzeCode(code: string, options: AnalysisOptions = {}): Promise<GeminiResponse> {
    const apiKey = await this.getApiKey();

    if (!apiKey) {
      return {
        success: false,
        error: 'API key not set. Please configure your Gemini API key.',
        text: null
      };
    }

    // Создаем промпт для анализа кода
    const prompt = this.buildAnalysisPrompt(code, options);

    // Выполняем запрос
    return await this.makeRequest(apiKey, prompt);
  }

  /**
   * Создает промпт для анализа кода
   * @param code - Код для анализа
   * @param options - Параметры анализа
   * @returns Промпт для AI
   */
  private buildAnalysisPrompt(code: string, options: AnalysisOptions = {}): string {
    const {
      language = 'unknown',
      context = '',
      analysisType = 'explain'
    } = options;

    const prompts: Record<string, string> = {
      explain: `Проанализируй следующий код и объясни:
1. Что делает этот код?
2. Какова основная логика и алгоритм?
3. Какие возможные проблемы или улучшения?

${language !== 'unknown' ? `Язык программирования: ${language}` : ''}
${context ? `Контекст: ${context}` : ''}

Код:
\`\`\`
${code}
\`\`\`

Предоставь краткое и понятное объяснение на русском языке.`,

      solve: `Это задача по программированию. Помоги с решением:

Условие задачи:
${code}

${context ? `Дополнительная информация: ${context}` : ''}

Предоставь:
1. Краткий анализ задачи
2. Подход к решению (алгоритм)
3. Оценку сложности
4. Пример кода (если уместно)

Ответ должен быть на русском языке и помогать понять, как решить задачу, но не давать полное готовое решение.`,

      optimize: `Проанализируй следующий код и предложи оптимизации:

${language !== 'unknown' ? `Язык: ${language}` : ''}

Код:
\`\`\`
${code}
\`\`\`

Предоставь:
1. Анализ текущей сложности
2. Узкие места в коде
3. Предложения по оптимизации
4. Улучшенную версию (если возможно)

Ответ на русском языке.`,

      debug: `Найди возможные ошибки и проблемы в коде:

${language !== 'unknown' ? `Язык: ${language}` : ''}

Код:
\`\`\`
${code}
\`\`\`

${context ? `Проблема: ${context}` : ''}

Предоставь:
1. Обнаруженные ошибки
2. Возможные причины
3. Предложения по исправлению

Ответ на русском языке.`
    };

    return prompts[analysisType] || prompts.explain;
  }

  /**
   * Получает краткую подсказку по коду
   * @param code - Код для анализа
   * @returns Ответ от AI
   */
  async getQuickHint(code: string): Promise<GeminiResponse> {
    const apiKey = await this.getApiKey();

    if (!apiKey) {
      return {
        success: false,
        error: 'API key not set',
        text: null
      };
    }

    const prompt = `Дай краткую подсказку (2-3 предложения) по этому коду:

\`\`\`
${code}
\`\`\`

Ответ на русском языке, максимально кратко и по делу.`;

    return await this.makeRequest(apiKey, prompt);
  }

  /**
   * Объясняет ошибку в коде
   * @param code - Код с ошибкой
   * @param error - Текст ошибки
   * @returns Ответ от AI
   */
  async explainError(code: string, error: string): Promise<GeminiResponse> {
    const apiKey = await this.getApiKey();

    if (!apiKey) {
      return {
        success: false,
        error: 'API key not set',
        text: null
      };
    }

    const prompt = `Объясни ошибку и как её исправить:

Код:
\`\`\`
${code}
\`\`\`

Ошибка:
${error}

Предоставь краткое объяснение причины и способ исправления на русском языке.`;

    return await this.makeRequest(apiKey, prompt);
  }
}

// Экспортируем singleton instance
const geminiService = new GeminiService();

export default geminiService;
