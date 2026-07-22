/**
 * Safe localStorage utilities for production use
 */

const STORAGE_PREFIX = 'wb_';

const AUTH_KEYS = ['token', 'user', 'userProfile', 'refresh_token'];

export function setStorageItem(key: string, value: unknown): void {
  try {
    const prefixedKey = `${STORAGE_PREFIX}${key}`;
    if (typeof value === 'string') {
      localStorage.setItem(prefixedKey, value);
    } else {
      localStorage.setItem(prefixedKey, JSON.stringify(value));
    }
  } catch (error) {
    console.error(`Failed to store ${key}:`, error);
  }
}

export function getStorageItem(key: string): string | null {
  try {
    const prefixedKey = `${STORAGE_PREFIX}${key}`;
    return localStorage.getItem(prefixedKey);
  } catch (error) {
    console.error(`Failed to retrieve ${key}:`, error);
    return null;
  }
}

export function removeStorageItem(key: string): void {
  try {
    const prefixedKey = `${STORAGE_PREFIX}${key}`;
    localStorage.removeItem(prefixedKey);
  } catch (error) {
    console.error(`Failed to remove ${key}:`, error);
  }
}

export function clearAllStorage(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX) || AUTH_KEYS.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
    sessionStorage.removeItem('auth_session');
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }
}
