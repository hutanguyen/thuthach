import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Database, 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Code2, 
  RefreshCw, 
  Table, 
  Sparkles,
  Info
} from 'lucide-react';
import { SUPABASE_SETUP_SQL, SUPABASE_URL } from '../utils/supabaseClient';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
}

export const SupabaseGuideModal: React.FC<Props> = ({
  isOpen,
  onClose,
  theme = 'light',
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'quick' | 'sql' | 'fetch'>('quick');
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 print:hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl border overflow-hidden my-auto ${
          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header Modal */}
        <div className={`p-4 sm:px-6 flex items-center justify-between border-b ${
          isDark ? 'bg-slate-850 border-slate-800' : 'bg-slate-50 border-slate-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
                Hướng Dẫn Kết Nối & Lấy Dữ Liệu Supabase
              </h2>
              <p className="text-xs text-slate-400">
                Lưu trữ đám mây và đồng bộ kết quả bài làm thí sinh theo thời gian thực
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className={`flex border-b px-6 pt-3 gap-2 text-xs font-bold ${
          isDark ? 'border-slate-800 bg-slate-850/50' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('quick')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'quick'
                ? isDark
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles size={14} />
            <span>1. Các bước kết nối</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? isDark
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 size={14} />
            <span>2. Mã SQL Tạo Bảng</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fetch')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'fetch'
                ? isDark
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table size={14} />
            <span>3. Cách lấy kết quả bài làm</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {activeTab === 'quick' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-emerald-50/50 border-emerald-100'
              }`}>
                <h3 className="font-black text-sm text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-2">
                  <Info size={16} />
                  Quy trình hoạt động tự động
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 list-disc list-inside">
                  <li>Khi thí sinh bấm <b>Bắt đầu thử thách</b>, hệ thống tự động lưu lượt thi vào bảng <code className="font-mono font-bold text-emerald-700 dark:text-emerald-400">player_logins</code>.</li>
                  <li>Khi nộp bài xong (hoặc hết giờ tự nộp), toàn bộ điểm số và bài làm chi tiết được gửi tức thì vào bảng <code className="font-mono font-bold text-emerald-700 dark:text-emerald-400">student_results</code>.</li>
                  <li>Thầy/Cô chỉ cần mở tab <b>Tổng hợp kết quả</b> và bấm nút <b>Đồng bộ kết quả</b> để cập nhật dữ liệu mới nhất từ đám mây.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-700 dark:text-slate-200">Các bước thiết lập dự án Supabase:</h4>
                <div className="grid grid-cols-1 gap-2.5">
                  <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                    isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200'
                  }`}>
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">1</span>
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-100">Tạo tài khoản và dự án mới trên Supabase</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Truy cập <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-600 dark:text-cyan-400 font-bold underline inline-flex items-center gap-1">supabase.com <ExternalLink size={11} /></a> và tạo một Project miễn phí.
                      </div>
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                    isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200'
                  }`}>
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">2</span>
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-100">Chạy tập lệnh SQL tạo bảng</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Vào mục <b>SQL Editor</b> trong Supabase Dashboard, dán đoạn mã SQL từ tab <b>2. Mã SQL Tạo Bảng</b> và bấm <b>Run</b>.
                      </div>
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                    isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200'
                  }`}>
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">3</span>
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-100">Lấy URL và Publishable / Anon API Key</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Vào <b>Project Settings → API</b>. Sao chép <b>Project URL</b> và <b>anon public API key</b> để điền vào tệp <code className="font-mono">.env</code> hoặc cập nhật trong <code className="font-mono">src/utils/supabaseClient.ts</code>.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Endpoint Supabase đang dùng:</span>{' '}
                  <b className="font-mono text-emerald-600 dark:text-cyan-400">{SUPABASE_URL}</b>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-600 dark:text-slate-300">
                  Đoạn mã SQL tạo bảng <code className="font-mono">player_logins</code> & <code className="font-mono">student_results</code>:
                </span>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Đã sao chép!' : 'Sao chép mã SQL'}</span>
                </button>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 text-slate-200 font-mono text-[11px] p-4 max-h-[350px] overflow-y-auto leading-relaxed">
                <pre>{SUPABASE_SETUP_SQL}</pre>
              </div>
            </div>
          )}

          {activeTab === 'fetch' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
                    <RefreshCw size={16} className="text-orange-500" />
                    Cách 1: Đồng bộ trực tiếp trong phần mềm
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Trên thanh tiêu đề của bảng <b>Tổng Hợp Kết Quả</b>, bấm nút <b>Đồng bộ kết quả</b>. Hệ thống sẽ tự động gọi Supabase và nạp toàn bộ danh sách thí sinh, điểm số, và chi tiết bài làm vào bảng.
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
                    <Table size={16} className="text-emerald-600 dark:text-cyan-400" />
                    Cách 2: Xem và tải trên Supabase Dashboard
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Đăng nhập vào <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="underline font-bold text-emerald-600 dark:text-cyan-400">Supabase Dashboard</a> → Chọn mục <b>Table Editor</b> → Chọn bảng <code className="font-mono">student_results</code> → Bấm nút <b>Export to CSV</b> để tải toàn bộ dữ liệu về máy.
                  </p>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-amber-50/50 border-amber-200'
              }`}>
                <h4 className="font-black text-xs text-amber-900 dark:text-amber-300 mb-2">
                  Ví dụ câu lệnh SQL trích xuất kết quả bài làm:
                </h4>
                <div className="bg-slate-950 text-slate-200 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
                  <code>{`-- Xem danh sách bài thi sắp xếp theo điểm số cao nhất:
SELECT name, student_class, score, total, percentage, evaluation, time_spent, submitted_at
FROM public.student_results
ORDER BY score DESC, submitted_at ASC;`}</code>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className={`p-4 sm:px-6 flex items-center justify-end border-t ${
          isDark ? 'bg-slate-850 border-slate-800' : 'bg-slate-50 border-slate-100'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs cursor-pointer transition-colors"
          >
            Đóng hướng dẫn
          </button>
        </div>
      </motion.div>
    </div>
  );
};
