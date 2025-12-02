/**
 * Code Analyzer Component
 *
 * Главный компонент для анализа кода
 */

import React, { useState, useEffect } from 'react';
import {
  Code,
  Sparkles,
  RefreshCw,
  Lightbulb,
  Bug,
  Zap,
  FileCode,
  Loader2
} from 'lucide-react';
import { useGemini } from '../hooks/useGemini';
import { usePageAnalysis } from '../hooks/usePageAnalysis';
import type { CodeBlock, AnalysisOptions } from '../types';

export const CodeAnalyzer: React.FC = () => {
  const { analysis, loading: analysisLoading, refresh } = usePageAnalysis();
  const { loading, error, response, analyzeCode, reset } = useGemini();

  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [analysisType, setAnalysisType] = useState<AnalysisOptions['analysisType']>('explain');

  // Автоматический анализ при обнаружении кода
  useEffect(() => {
    if (analysis?.hasCode && !response && !loading) {
      handleAutoAnalyze();
    }
  }, [analysis]);

  const handleAutoAnalyze = async () => {
    if (!analysis) return;

    // Приоритет: выделенный текст > первый блок кода
    const codeToAnalyze = analysis.selectedText || analysis.codeBlocks[0]?.text;

    if (codeToAnalyze) {
      setSelectedCode(codeToAnalyze);

      const options: AnalysisOptions = {
        language: analysis.codeBlocks[0]?.language || 'unknown',
        analysisType: 'explain',
        context: analysis.pageInfo.title
      };

      await analyzeCode(codeToAnalyze, options);
    }
  };

  const handleManualAnalyze = async (code: string, type: AnalysisOptions['analysisType']) => {
    setSelectedCode(code);
    setAnalysisType(type);

    const options: AnalysisOptions = {
      language: analysis?.codeBlocks[0]?.language || 'unknown',
      analysisType: type,
      context: analysis?.pageInfo.title
    };

    await analyzeCode(code, options);
  };

  const handleRefresh = async () => {
    reset();
    await refresh();
  };

  if (analysisLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!analysis?.hasCode) {
    return (
      <div className="p-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <Code className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Код не обнаружен
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          На этой странице не найдено блоков кода для анализа
        </p>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Обновить анализ
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Заголовок */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-600" />
            Code Helper
          </h2>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Обновить анализ"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-xs text-gray-600">
          {analysis.pageInfo.isProgrammingSite ? '🎯 ' : ''}
          Найдено блоков кода: {analysis.codeBlocks.length}
        </p>
      </div>

      {/* Блоки кода */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {analysis.codeBlocks.slice(0, 3).map((block, index) => (
          <CodeBlockCard
            key={index}
            block={block}
            index={index}
            onAnalyze={handleManualAnalyze}
            isActive={selectedCode === block.text}
          />
        ))}
      </div>

      {/* Результат анализа */}
      {(loading || response || error) && (
        <div className="border-t border-gray-200 bg-gray-50 p-4 max-h-80 overflow-y-auto">
          {loading && (
            <div className="flex items-center gap-3 text-primary-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Анализирую код...</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {response && (
            <div className="prose prose-sm max-w-none">
              <div className="mb-2 flex items-center gap-2 text-primary-600 text-xs font-semibold uppercase">
                <Sparkles className="w-4 h-4" />
                Результат анализа
              </div>
              <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {response}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface CodeBlockCardProps {
  block: CodeBlock;
  index: number;
  onAnalyze: (code: string, type: AnalysisOptions['analysisType']) => void;
  isActive: boolean;
}

const CodeBlockCard: React.FC<CodeBlockCardProps> = ({
  block,
  index,
  onAnalyze,
  isActive
}) => {
  const truncatedCode = block.text.length > 200
    ? block.text.substring(0, 200) + '...'
    : block.text;

  return (
    <div
      className={`border rounded-lg p-3 transition-all ${
        isActive
          ? 'border-primary-500 bg-primary-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-gray-600" />
          <span className="text-xs font-medium text-gray-700">
            Блок {index + 1}
          </span>
          {block.language !== 'unknown' && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
              {block.language}
            </span>
          )}
        </div>
      </div>

      <pre className="text-xs text-gray-600 mb-3 overflow-x-auto bg-gray-50 p-2 rounded border border-gray-200">
        <code>{truncatedCode}</code>
      </pre>

      <div className="flex gap-2">
        <button
          onClick={() => onAnalyze(block.text, 'explain')}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-primary-600 text-white text-xs rounded hover:bg-primary-700 transition-colors"
        >
          <Lightbulb className="w-3 h-3" />
          Объяснить
        </button>
        <button
          onClick={() => onAnalyze(block.text, 'optimize')}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
        >
          <Zap className="w-3 h-3" />
          Оптимизировать
        </button>
        <button
          onClick={() => onAnalyze(block.text, 'debug')}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 transition-colors"
        >
          <Bug className="w-3 h-3" />
          Дебаг
        </button>
      </div>
    </div>
  );
};
