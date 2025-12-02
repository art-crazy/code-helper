/**
 * usePageAnalysis Hook
 *
 * React hook для получения анализа текущей страницы
 */

import { useState, useEffect, useCallback } from 'react';
import type { PageAnalysis } from '../types';

interface UsePageAnalysisReturn {
  analysis: PageAnalysis | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getSelectedText: () => Promise<string | null>;
}

/**
 * Хук для работы с анализом страницы
 * @returns Данные анализа и функции управления
 */
export function usePageAnalysis(): UsePageAnalysisReturn {
  const [analysis, setAnalysis] = useState<PageAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Загружает анализ из storage
   */
  const loadAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Получаем данные из storage
      const result = await chrome.storage.local.get(['pageAnalysis']);

      if (result.pageAnalysis) {
        setAnalysis(result.pageAnalysis);
      } else {
        // Если данных нет, запрашиваем анализ у content script
        await requestAnalysis();
      }
    } catch (err) {
      console.error('Error loading analysis:', err);
      setError('Failed to load page analysis');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Запрашивает новый анализ страницы
   */
  const requestAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Получаем активную вкладку
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.id) {
        throw new Error('No active tab found');
      }

      // Отправляем сообщение content script
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'analyzePage'
      });

      if (response?.success) {
        setAnalysis(response.data);
      } else {
        throw new Error('Failed to analyze page');
      }
    } catch (err) {
      console.error('Error requesting analysis:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze page');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Получает выделенный текст
   */
  const getSelectedText = useCallback(async (): Promise<string | null> => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.id) return null;

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'getSelectedText'
      });

      return response?.data?.text || null;
    } catch (err) {
      console.error('Error getting selected text:', err);
      return null;
    }
  }, []);

  /**
   * Слушаем изменения в storage
   */
  useEffect(() => {
    loadAnalysis();

    // Подписываемся на изменения storage
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'local' && changes.pageAnalysis) {
        setAnalysis(changes.pageAnalysis.newValue);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [loadAnalysis]);

  return {
    analysis,
    loading,
    error,
    refresh: requestAnalysis,
    getSelectedText,
  };
}
