/**
 * Storage Utilities
 *
 * Утилиты для работы с Chrome Storage API
 */

/**
 * Сохраняет данные в chrome.storage.local
 * @param key - Ключ
 * @param value - Значение
 * @returns true если успешно
 */
export async function setLocal<T>(key: string, value: T): Promise<boolean> {
  try {
    await chrome.storage.local.set({ [key]: value });
    return true;
  } catch (error) {
    console.error('Error saving to local storage:', error);
    return false;
  }
}

/**
 * Получает данные из chrome.storage.local
 * @param key - Ключ
 * @returns Значение или null
 */
export async function getLocal<T>(key: string): Promise<T | null> {
  try {
    const result = await chrome.storage.local.get([key]);
    return result[key] as T || null;
  } catch (error) {
    console.error('Error reading from local storage:', error);
    return null;
  }
}

/**
 * Сохраняет данные в chrome.storage.sync
 * @param key - Ключ
 * @param value - Значение
 * @returns true если успешно
 */
export async function setSync<T>(key: string, value: T): Promise<boolean> {
  try {
    await chrome.storage.sync.set({ [key]: value });
    return true;
  } catch (error) {
    console.error('Error saving to sync storage:', error);
    return false;
  }
}

/**
 * Получает данные из chrome.storage.sync
 * @param key - Ключ
 * @returns Значение или null
 */
export async function getSync<T>(key: string): Promise<T | null> {
  try {
    const result = await chrome.storage.sync.get([key]);
    return result[key] as T || null;
  } catch (error) {
    console.error('Error reading from sync storage:', error);
    return null;
  }
}

/**
 * Удаляет данные из storage
 * @param key - Ключ
 * @param type - 'local' или 'sync'
 * @returns true если успешно
 */
export async function removeItem(key: string, type: 'local' | 'sync' = 'local'): Promise<boolean> {
  try {
    if (type === 'sync') {
      await chrome.storage.sync.remove(key);
    } else {
      await chrome.storage.local.remove(key);
    }
    return true;
  } catch (error) {
    console.error('Error removing from storage:', error);
    return false;
  }
}

/**
 * Очищает все данные из storage
 * @param type - 'local' или 'sync'
 * @returns true если успешно
 */
export async function clearStorage(type: 'local' | 'sync' = 'local'): Promise<boolean> {
  try {
    if (type === 'sync') {
      await chrome.storage.sync.clear();
    } else {
      await chrome.storage.local.clear();
    }
    return true;
  } catch (error) {
    console.error('Error clearing storage:', error);
    return false;
  }
}
