import { StudentResult } from '../types';

const DB_NAME = 'QuizAppletDB';
const STORE_NAME = 'results_store';
const DB_VERSION = 2;
export const RESULTS_STORAGE_KEY = 'quiz_student_results';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('questions_store')) {
        db.createObjectStore('questions_store');
      }
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Lọc bỏ các trường dữ liệu nặng (chi tiết bài làm, ảnh) để lưu vào localStorage một cách an toàn
 * không làm tràn bộ nhớ giới hạn 5MB của trình duyệt.
 */
export const sanitizeResultsForLocalStorage = (results: StudentResult[]): Partial<StudentResult>[] => {
  return results.slice(0, 100).map(r => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { quizDetails, ...lightweight } = r;
    return lightweight;
  });
};

/**
 * Lưu danh sách kết quả bài làm:
 * 1. Lưu toàn vẹn (bao gồm quizDetails) vào IndexedDB (dung lượng không giới hạn)
 * 2. Lưu bản sao rút gọn vào localStorage để tương thích nhanh, có cơ chế tự động giảm tải tránh QuotaExceededError
 */
export const saveResultsToStorage = async (results: StudentResult[]): Promise<void> => {
  // 1. Lưu bản sao nhẹ vào localStorage
  try {
    const lightList = sanitizeResultsForLocalStorage(results);
    localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(lightList));
  } catch (err) {
    // Nếu bộ nhớ localStorage bị đầy, thử lưu 25 kết quả gần nhất
    try {
      const minimalList = sanitizeResultsForLocalStorage(results).slice(0, 25);
      localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(minimalList));
    } catch {
      // Bỏ qua lỗi localStorage đầy một cách an toàn vì IndexedDB và Supabase đã lưu trữ đầy đủ
      console.warn('LocalStorage đã đầy hạn mức, bài làm được bảo toàn an toàn trong IndexedDB và Supabase.');
    }
  }

  // 2. Lưu toàn bộ (bao gồm quizDetails đầy đủ) vào IndexedDB
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(results, 'all_results');
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Ghi dữ liệu kết quả vào IndexedDB:', err);
  }
};

/**
 * Đọc danh sách kết quả thi từ IndexedDB (đầy đủ chi tiết) hoặc localStorage (dự phòng)
 */
export const loadResultsFromStorage = async (): Promise<StudentResult[]> => {
  // 1. Thử lấy từ IndexedDB trước (chứa dữ liệu đầy đủ nhất kèm quizDetails)
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get('all_results');
    const idbData = await new Promise<StudentResult[] | undefined>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (Array.isArray(idbData) && idbData.length > 0) {
      return idbData;
    }
  } catch {
    // Fallback sang localStorage nếu IndexedDB chưa sẵn sàng
  }

  // 2. Dự phòng lấy từ localStorage
  try {
    const saved = localStorage.getItem(RESULTS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed as StudentResult[];
      }
    }
  } catch {
    // Không ném lỗi
  }

  return [];
};

/**
 * Xóa toàn bộ kết quả khỏi cả IndexedDB và localStorage
 */
export const clearResultsFromStorage = async (): Promise<void> => {
  try {
    localStorage.removeItem(RESULTS_STORAGE_KEY);
  } catch {}

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete('all_results');
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Xóa kết quả trong IndexedDB:', err);
  }
};
