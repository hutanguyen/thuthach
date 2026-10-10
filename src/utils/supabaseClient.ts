import { createClient } from '@supabase/supabase-js';
import { StudentInfo, StudentResult } from '../types';

export const SUPABASE_URL: string =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL) ||
  'https://uzapqxzdmwlwrmroshyi.supabase.co';

export const SUPABASE_PUBLISHABLE_KEY: string =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
  'sb_publishable_--_-c3eLHU3nzAIzIUvw3w_PiqkOJJe';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const SUPABASE_SETUP_SQL = `-- Bảng 1: Lưu thông tin người chơi khi đăng nhập / bắt đầu làm bài
CREATE TABLE IF NOT EXISTS public.player_logins (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  student_code TEXT,
  student_class TEXT,
  participant_type TEXT,
  logged_in_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng 2: Lưu kết quả sau khi hoàn thành thử thách (Bảng tổng hợp)
CREATE TABLE IF NOT EXISTS public.student_results (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  student_code TEXT,
  student_class TEXT,
  participant_type TEXT,
  score INTEGER DEFAULT 0,
  total INTEGER DEFAULT 0,
  percentage INTEGER DEFAULT 0,
  evaluation TEXT,
  submitted_at TEXT,
  answers JSONB,
  time_spent TEXT,
  auto_submitted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bật RLS và phân quyền cho Public / Anon key
ALTER TABLE public.player_logins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert player_logins" ON public.player_logins;
CREATE POLICY "Allow public insert player_logins" ON public.player_logins FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read player_logins" ON public.player_logins;
CREATE POLICY "Allow public read player_logins" ON public.player_logins FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public all student_results" ON public.student_results;
CREATE POLICY "Allow public all student_results" ON public.student_results FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
`;

/**
 * Lưu thông tin đăng nhập của người chơi vào Supabase
 */
export async function savePlayerLoginToSupabase(studentInfo: StudentInfo): Promise<{ success: boolean; error?: string }> {
  try {
    const isOther = studentInfo.participantType === 'other';
    const payload = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: studentInfo.name.trim(),
      student_code: isOther ? '' : (studentInfo.studentCode || '').trim(),
      student_class: isOther ? 'Khác' : (studentInfo.studentClass || '').trim(),
      participant_type: isOther ? 'other' : 'student',
      logged_in_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('player_logins').insert([payload]);

    if (error) {
      console.warn('Lưu đăng nhập vào Supabase (thử snake_case thất bại):', error.message);
      // Thử fallback sang camelCase nếu user tạo bảng dạng camelCase
      const camelPayload = {
        id: payload.id,
        name: payload.name,
        studentCode: payload.student_code,
        studentClass: payload.student_class,
        participantType: payload.participant_type,
        loggedInAt: payload.logged_in_at,
      };
      const { error: err2 } = await supabase.from('player_logins').insert([camelPayload]);
      if (err2) {
        console.warn('Lưu đăng nhập vào Supabase không thành công:', err2.message);
        return { success: false, error: err2.message };
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('Lỗi khi gửi thông tin đăng nhập lên Supabase:', err);
    return { success: false, error: err?.message || 'Lỗi mạng hoặc kết nối' };
  }
}

/**
 * Lưu kết quả sau khi hoàn thành bài thi vào Supabase
 */
export async function saveStudentResultToSupabase(result: StudentResult): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      id: result.id,
      name: result.name,
      student_code: result.studentCode || '',
      student_class: result.studentClass || '',
      participant_type: result.participantType || 'student',
      score: result.score,
      total: result.total,
      percentage: result.percentage,
      evaluation: result.evaluation || '',
      submitted_at: result.submittedAt,
      answers: result.answers || {},
      time_spent: result.timeSpentFormatted || null,
      auto_submitted: !!result.autoSubmitted,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('student_results').insert([payload]);

    if (error) {
      console.warn('Lưu kết quả vào Supabase (thử snake_case):', error.message);
      // Thử fallback camelCase
      const camelPayload = {
        id: result.id,
        name: result.name,
        studentCode: result.studentCode || '',
        studentClass: result.studentClass || '',
        participantType: result.participantType || 'student',
        score: result.score,
        total: result.total,
        percentage: result.percentage,
        evaluation: result.evaluation || '',
        submittedAt: result.submittedAt,
        answers: result.answers || {},
        timeSpentFormatted: result.timeSpentFormatted || null,
        autoSubmitted: !!result.autoSubmitted,
      };
      const { error: err2 } = await supabase.from('student_results').insert([camelPayload]);
      if (err2) {
        console.warn('Lưu kết quả lên Supabase không thành công:', err2.message);
        return { success: false, error: err2.message };
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('Lỗi khi lưu kết quả lên Supabase:', err);
    return { success: false, error: err?.message || 'Lỗi mạng hoặc kết nối' };
  }
}

/**
 * Lấy danh sách kết quả bài làm từ Supabase (dùng cho Bảng tổng hợp)
 */
export async function fetchStudentResultsFromSupabase(): Promise<{ results: StudentResult[] | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('student_results')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Tải kết quả từ Supabase:', error.message);
      return { results: null, error: error.message };
    }

    if (!Array.isArray(data)) {
      return { results: [] };
    }

    // Chuẩn hóa dữ liệu về đúng kiểu StudentResult
    const normalized: StudentResult[] = data.map((row: any) => ({
      id: String(row.id || `${Date.now()}`),
      name: String(row.name || ''),
      studentCode: String(row.student_code ?? row.studentCode ?? ''),
      studentClass: String(row.student_class ?? row.studentClass ?? ''),
      participantType: (row.participant_type ?? row.participantType) === 'other' ? 'other' : 'student',
      score: Number(row.score ?? 0),
      total: Number(row.total ?? 0),
      percentage: Number(row.percentage ?? 0),
      evaluation: String(row.evaluation ?? ''),
      submittedAt: String(row.submitted_at ?? row.submittedAt ?? ''),
      answers: typeof row.answers === 'object' && row.answers !== null ? row.answers : {},
      autoSubmitted: Boolean(row.auto_submitted ?? row.autoSubmitted),
      timeSpentFormatted: row.time_spent ?? row.timeSpentFormatted ?? row.time_spent_formatted ?? undefined,
    }));

    return { results: normalized };
  } catch (err: any) {
    console.error('Lỗi khi tải kết quả từ Supabase:', err);
    return { results: null, error: err?.message || 'Lỗi kết nối Supabase' };
  }
}

/**
 * Xóa một bản ghi kết quả trên Supabase
 */
export async function deleteStudentResultFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('student_results').delete().eq('id', id);
    if (error) {
      console.warn('Không thể xóa trên Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Lỗi khi xóa kết quả trên Supabase:', err);
    return false;
  }
}

/**
 * Xóa toàn bộ kết quả trên Supabase
 */
export async function clearAllStudentResultsFromSupabase(): Promise<boolean> {
  try {
    const { error } = await supabase.from('student_results').delete().neq('id', '');
    if (error) {
      console.warn('Không thể xóa toàn bộ trên Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Lỗi khi xóa toàn bộ kết quả trên Supabase:', err);
    return false;
  }
}
