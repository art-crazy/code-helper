/**
 * useGemini Hook
 *
 * React hook для работы с Gemini API
 */

import { useState, useCallback } from 'react';
import geminiService from '../services/gemini';
import type { AnalysisOptions, GeminiResponse } from '../types';

interface UseGeminiReturn {
  loading: boolean;
  error: string | null;
  response: string | null;
  analyzeCode: (code: string, options?: AnalysisOptions) => Promise<GeminiResponse>;
  getQuickHint: (code: string) => Promise<GeminiResponse>;
  explainError: (code: string, errorText: string) => Promise<GeminiResponse>;
  reset: () => void;
}

/**
 * Хук для работы с Gemini API
 * @returns Состояние и функции для работы с API
 */
export function useGemini(): UseGeminiReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<string | null>(null);

  /**
   * Анализирует код через Gemini API
   */
  const analyzeCode = useCallback(async (code: string, options: AnalysisOptions = {}): Promise<GeminiResponse> => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await geminiService.analyzeCode(code, options);

      if (result.success) {
        setResponse(result.text);
      } else {
        setError(result.error || 'Unknown error occurred');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze code';
      setError(errorMessage);
      return { success: false, error: errorMessage, text: null };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Получает быструю подсказку
   */
  const getQuickHint = useCallback(async (code: string): Promise<GeminiResponse> => {
    setLoading(true);
    setError(null);

    try {
      const result = await geminiService.getQuickHint(code);

      if (result.success) {
        setResponse(result.text);
      } else {
        setError(result.error || 'Unknown error occurred');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get hint';
      setError(errorMessage);
      return { success: false, error: errorMessage, text: null };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Объясняет ошибку
   */
  const explainError = useCallback(async (code: string, errorText: string): Promise<GeminiResponse> => {
    setLoading(true);
    setError(null);

    try {
      const result = await geminiService.explainError(code, errorText);

      if (result.success) {
        setResponse(result.text);
      } else {
        setError(result.error || 'Unknown error occurred');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to explain error';
      setError(errorMessage);
      return { success: false, error: errorMessage, text: null };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Сброс состояния
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setResponse(null);
  }, []);

  return {
    loading,
    error,
    response,
    analyzeCode,
    getQuickHint,
    explainError,
    reset,
  };
}
