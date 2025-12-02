/**
 * Background Service Worker
 *
 * Обработчик фоновых задач для расширения:
 * - Управление иконкой расширения
 * - Обработка событий установки/обновления
 * - Центральная точка для обмена сообщениями
 */

/**
 * Обработчик установки расширения
 */
chrome.runtime.onInstalled.addListener((details: chrome.runtime.InstalledDetails) => {
  if (details.reason === 'install') {
    console.log('🎉 Code Helper installed!');

    // Открываем страницу приветствия
    chrome.tabs.create({
      url: 'https://ai.google.dev/gemini-api/docs/api-key'
    });

    // Устанавливаем начальные настройки
    chrome.storage.sync.set({
      firstRun: true,
      installDate: Date.now()
    });
  }

  if (details.reason === 'update') {
    console.log('🔄 Code Helper updated!');
  }
});

/**
 * Обработчик клика по иконке расширения
 */
chrome.action.onClicked.addListener((tab: chrome.tabs.Tab) => {
  // Открываем popup (уже настроено в manifest)
  console.log('Extension icon clicked on tab:', tab.id);
});

/**
 * Обработчик сообщений от других частей расширения
 */
chrome.runtime.onMessage.addListener((
  request: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) => {
  console.log('Background received message:', request);

  // Можно добавить дополнительную логику обработки сообщений
  if (request.action === 'ping') {
    sendResponse({ status: 'pong' });
  }

  return true; // Асинхронный ответ
});

/**
 * Обновляет иконку расширения в зависимости от наличия кода
 */
chrome.tabs.onActivated.addListener(async (activeInfo: chrome.tabs.TabActiveInfo) => {
  try {
    const tabId = activeInfo.tabId;

    // Получаем анализ страницы из storage
    const result = await chrome.storage.local.get(['pageAnalysis']);

    if (result.pageAnalysis?.hasCode) {
      // Устанавливаем badge для индикации
      chrome.action.setBadgeText({
        text: '✓',
        tabId: tabId
      });

      chrome.action.setBadgeBackgroundColor({
        color: '#10b981', // Зеленый
        tabId: tabId
      });
    } else {
      chrome.action.setBadgeText({
        text: '',
        tabId: tabId
      });
    }
  } catch (error) {
    console.error('Error updating badge:', error);
  }
});

console.log('🚀 Code Helper: Background service worker started');
