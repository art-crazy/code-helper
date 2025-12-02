/**
 * Main Popup Application
 *
 * Главный компонент popup окна расширения
 */

import React, { useState, useEffect } from 'react';
import { ApiKeySetup } from '../components/ApiKeySetup';
import { CodeAnalyzer } from '../components/CodeAnalyzer';
import geminiService from '../services/gemini';

export const App: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    setLoading(true);
    const apiKey = await geminiService.getApiKey();
    setHasApiKey(!!apiKey);
    setLoading(false);
  };

  const handleApiKeySuccess = () => {
    setHasApiKey(true);
  };

  if (loading) {
    return (
      <div className="w-[450px] h-[600px] flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[450px] h-[600px] bg-white flex flex-col">
      {!hasApiKey ? (
        <ApiKeySetup onSuccess={handleApiKeySuccess} />
      ) : (
        <CodeAnalyzer />
      )}
    </div>
  );
};
