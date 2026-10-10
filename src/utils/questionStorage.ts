import { Question } from '../types';
import { QUIZ_QUESTIONS } from '../constants';

const DB_NAME = 'QuizAppletDB';
const STORE_NAME = 'questions_store';
const DB_VERSION = 2;
const LOCAL_STORAGE_KEY = 'quiz_custom_questions';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains('results_store')) {
        db.createObjectStore('results_store');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Saves questions to IndexedDB and syncs to localStorage when possible
 */
export const saveQuestionsToStorage = async (questions: Question[]): Promise<void> => {
  // Try saving to localStorage
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(questions));
  } catch (err) {
    console.warn('localStorage full or quota exceeded, saving to IndexedDB:', err);
  }

  // Save to IndexedDB for large image payloads
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(questions, 'current_questions');
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB save error:', err);
  }
};

/**
 * Loads questions from IndexedDB or localStorage
 */
export const loadQuestionsFromStorage = async (): Promise<Question[]> => {
  // 1. Try IndexedDB first
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get('current_questions');
    const idbData = await new Promise<Question[] | undefined>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (Array.isArray(idbData) && idbData.length > 0) {
      return idbData;
    }
  } catch {
    // ignore, fall back to localStorage
  }

  // 2. Fall back to localStorage
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading questions from localStorage:', err);
  }

  return QUIZ_QUESTIONS;
};
