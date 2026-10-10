import { QuizTimerConfig } from '../types';

export const TIMER_STORAGE_KEY = 'quiz_timer_config';

export const DEFAULT_TIMER_CONFIG: QuizTimerConfig = {
  enabled: false, // Mặc định tắt (có thể bật hoặc tắt tùy vào bộ đề theo yêu cầu)
  durationMinutes: 15, // Thời gian mặc định 15 phút
  durationSeconds: 0,
};

/**
 * Tải cấu hình đồng hồ đếm ngược từ localStorage
 */
export const loadTimerConfig = (): QuizTimerConfig => {
  try {
    const saved = localStorage.getItem(TIMER_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed.enabled === 'boolean') {
        const mins = Number(parsed.durationMinutes);
        const secs = Number(parsed.durationSeconds);
        return {
          enabled: parsed.enabled,
          durationMinutes: Number.isFinite(mins) && mins > 0 ? Math.min(180, Math.max(1, Math.floor(mins))) : 15,
          durationSeconds: Number.isFinite(secs) && secs >= 0 ? Math.min(59, Math.max(0, Math.floor(secs))) : 0,
        };
      }
    }
  } catch (e) {
    console.error('Lỗi khi tải cài đặt timer:', e);
  }
  return { ...DEFAULT_TIMER_CONFIG };
};

/**
 * Lưu cấu hình đồng hồ đếm ngược vào localStorage
 */
export const saveTimerConfig = (config: QuizTimerConfig): void => {
  try {
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Lỗi khi lưu cài đặt timer:', e);
  }
};
