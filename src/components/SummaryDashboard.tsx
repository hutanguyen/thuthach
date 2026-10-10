import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  FileSpreadsheet, 
  Search, 
  Trash2, 
  Users, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  Filter,
  Download,
  AlertTriangle,
  Cloud,
  RefreshCw,
  Copy,
  Check,
  Database
} from 'lucide-react';
import { StudentResult } from '../types';
import { exportToExcel, exportSingleResultToExcel } from '../utils/excelExport';
import { SUPABASE_SETUP_SQL, SUPABASE_URL } from '../utils/supabaseClient';

interface Props {
  results: StudentResult[];
  onBack?: () => void;
  onClearAll: () => void;
  onDeleteSingle: (id: string) => void;
  theme?: 'light' | 'dark';
  onSyncResults?: () => Promise<void>;
}

export const SummaryDashboard: React.FC<Props> = ({
  results,
  onBack,
  onClearAll,
  onDeleteSingle,
  theme = 'light',
  onSyncResults,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [hasCopiedSql, setHasCopiedSql] = useState(false);
  const isDark = theme === 'dark';

  const handleTriggerSync = async () => {
    if (!onSyncResults) return;
    setIsSyncing(true);
    setSyncNotice(null);
    try {
      await onSyncResults();
      setSyncNotice({ type: 'success', message: 'Đã đồng bộ kết quả mới nhất từ Supabase thành công!' });
      setTimeout(() => setSyncNotice(null), 3500);
    } catch (err: any) {
      setSyncNotice({
        type: 'error',
        message: err?.message || 'Chưa thể tải dữ liệu từ Supabase. Vui lòng kiểm tra bảng student_results.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setHasCopiedSql(true);
    setTimeout(() => setHasCopiedSql(false), 3000);
  };

  // Extract unique classes for filter
  const uniqueClasses = useMemo(() => {
    const classes = results.map(r => r.studentClass.trim().toUpperCase());
    return Array.from(new Set(classes)).sort();
  }, [results]);

  // Filtered results
  const filteredResults = useMemo(() => {
    return results.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.studentClass.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.studentCode && item.studentCode.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesClass = 
        selectedClassFilter === 'ALL' || 
        item.studentClass.trim().toUpperCase() === selectedClassFilter;

      return matchesSearch && matchesClass;
    });
  }, [results, searchTerm, selectedClassFilter]);

  // Calculate summary metrics
  const stats = useMemo(() => {
    if (results.length === 0) {
      return { total: 0, avgPercentage: 0, maxScore: 0, passRate: 0 };
    }
    const total = results.length;
    const sumPercentages = results.reduce((acc, curr) => acc + curr.percentage, 0);
    const avgPercentage = Math.round(sumPercentages / total);
    const maxScore = Math.max(...results.map(r => r.score));
    const passedCount = results.filter(r => r.percentage >= 50).length;
    const passRate = Math.round((passedCount / total) * 100);

    return { total, avgPercentage, maxScore, passRate };
  }, [results]);

  const handleExportAll = () => {
    exportToExcel(filteredResults, 'Bang_Tong_Hop_Ket_Qua_Hoc_Sinh.xlsx');
  };

  return (
    <motion.div
      key="summary"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className={`w-full max-w-5xl rounded-3xl shadow-2xl p-6 md:p-8 border my-auto transition-colors duration-300 ${
        isDark
          ? 'bg-slate-900 border-slate-700/80 text-white shadow-cyan-950/40'
          : 'bg-white border-slate-100 text-slate-800 shadow-slate-200/50'
      }`}
    >
      {/* Top Header */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b ${
        isDark ? 'border-slate-800' : 'border-slate-100'
      }`}>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
              <FileSpreadsheet className={isDark ? 'text-cyan-400' : 'text-emerald-600'} size={30} />
              Tổng Hợp Kết Quả
            </h1>
            <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black border ${
              isDark ? 'bg-cyan-950/70 text-cyan-300 border-cyan-800' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              <Cloud size={12} className="text-emerald-500 animate-pulse" />
              Supabase Cloud
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Dữ liệu tự động đồng bộ trên đám mây Supabase
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
          {onSyncResults && (
            <button
              type="button"
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                isDark
                  ? 'border-cyan-800/70 bg-slate-800/90 hover:bg-slate-700 text-cyan-300'
                  : 'border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-700'
              } disabled:opacity-50`}
              title="Đồng bộ lại kết quả từ Supabase"
            >
              <RefreshCw size={14} className={isSyncing ? 'animate-spin text-cyan-400' : ''} />
              <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ Cloud'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowSqlModal(true)}
            className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
              isDark
                ? 'border-slate-700 bg-slate-800/60 hover:bg-slate-750 text-slate-300'
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
            }`}
            title="Xem mã lệnh SQL cài đặt Supabase"
          >
            <Database size={14} className="text-amber-500" />
            <span>Mã SQL</span>
          </button>

          <button
            type="button"
            onClick={handleExportAll}
            disabled={filteredResults.length === 0}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-400/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <Download size={16} />
            <span>Xuất Excel ({filteredResults.length})</span>
          </button>

          {results.length > 0 && (
            <button
              type="button"
              onClick={() => setShowConfirmClear(true)}
              className="p-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl transition-colors cursor-pointer"
              title="Xóa toàn bộ kết quả"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Sync Notification Banner */}
      {syncNotice && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-4 p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2.5 shadow-sm ${
            syncNotice.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {syncNotice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{syncNotice.message}</span>
          </div>
          {syncNotice.type === 'error' && (
            <button
              type="button"
              onClick={() => setShowSqlModal(true)}
              className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-black underline cursor-pointer"
            >
              Xem mã tạo bảng SQL
            </button>
          )}
        </motion.div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 my-6">
        <div className={`p-4 rounded-2xl border ${
          isDark ? 'bg-cyan-950/40 border-cyan-800/60' : 'bg-emerald-50/70 border-emerald-100'
        }`}>
          <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider mb-1 ${
            isDark ? 'text-cyan-300' : 'text-emerald-700'
          }`}>
            <Users size={16} /> Số lượt làm bài
          </div>
          <div className="text-2xl md:text-3xl font-black">{stats.total}</div>
        </div>

        <div className={`p-4 rounded-2xl border ${
          isDark ? 'bg-teal-950/40 border-teal-800/60' : 'bg-teal-50/70 border-teal-100'
        }`}>
          <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider mb-1 ${
            isDark ? 'text-teal-300' : 'text-teal-700'
          }`}>
            <TrendingUp size={16} /> TỶ LỆ ĐÚNG TRUNG BÌNH
          </div>
          <div className="text-2xl md:text-3xl font-black">
            {stats.avgPercentage}%
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${
          isDark ? 'bg-amber-950/40 border-amber-800/60' : 'bg-amber-50/70 border-amber-100'
        }`}>
          <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider mb-1 ${
            isDark ? 'text-amber-300' : 'text-amber-700'
          }`}>
            <Award size={16} /> Điểm cao nhất
          </div>
          <div className="text-2xl md:text-3xl font-black">
            {stats.maxScore} <span className="text-xs font-normal opacity-70">câu</span>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${
          isDark ? 'bg-indigo-950/40 border-indigo-800/60' : 'bg-indigo-50/70 border-indigo-100'
        }`}>
          <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider mb-1 ${
            isDark ? 'text-indigo-300' : 'text-indigo-700'
          }`}>
            <CheckCircle2 size={16} /> Tỷ lệ đạt (≥50%)
          </div>
          <div className="text-2xl md:text-3xl font-black">{stats.passRate}%</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-grow">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên học sinh, lớp hoặc STT / Mã số..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-400'
                : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-400'
            }`}
          />
        </div>

        {uniqueClasses.length > 0 && (
          <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <Filter size={16} className="text-slate-400" />
            <select
              value={selectedClassFilter}
              onChange={e => setSelectedClassFilter(e.target.value)}
              className="bg-transparent text-sm font-bold outline-none cursor-pointer"
            >
              <option value="ALL" className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                Tất cả các lớp ({results.length})
              </option>
              {uniqueClasses.map(cls => (
                <option key={cls} value={cls} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                  Lớp {cls}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Results Table */}
      <div className={`overflow-x-auto rounded-2xl border shadow-sm mb-6 ${
        isDark ? 'border-slate-700' : 'border-slate-200'
      }`}>
        <table className="w-full text-left text-sm">
          <thead className={`font-black text-xs uppercase tracking-wider border-b ${
            isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}>
            <tr>
              <th className="py-3 px-3 text-center w-12">#</th>
              <th className="py-3 px-3 text-center">STT / Mã số</th>
              <th className="py-3 px-4">Họ và tên</th>
              <th className="py-3 px-3">Lớp</th>
              <th className="py-3 px-3 text-center">Điểm số</th>
              <th className="py-3 px-3 text-center">Tỷ lệ</th>
              <th className="py-3 px-3">Xếp loại</th>
              <th className="py-3 px-3">Thời gian nộp</th>
              <th className="py-3 px-3 text-center w-24">Thao tác</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-slate-800 text-slate-200' : 'divide-slate-100 text-slate-800'}`}>
            {filteredResults.length > 0 ? (
              filteredResults.map((item, idx) => (
                <tr key={item.id} className={isDark ? 'hover:bg-slate-800/50 transition-colors' : 'hover:bg-emerald-50/40 transition-colors'}>
                  <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-3 text-center font-black">
                    {item.studentCode ? (
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                        isDark ? 'bg-slate-800 text-cyan-300 border border-slate-700' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {item.studentCode}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-black">{item.name}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {item.studentClass}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`font-black text-base ${isDark ? 'text-cyan-400' : 'text-emerald-700'}`}>
                      {item.score}
                    </span>
                    <span className="text-slate-400 text-xs">/{item.total}</span>
                  </td>
                  <td className="py-3 px-3 text-center font-extrabold text-slate-400">
                    {item.percentage}%
                  </td>
                  <td className="py-3 px-3 font-semibold text-xs">
                    {item.participantType === 'other' ? (
                      <span className="text-slate-400 text-xs font-bold">-</span>
                    ) : (
                      <span className={`inline-block px-2.5 py-1 rounded-full font-bold ${
                        isDark ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.evaluation}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-xs text-slate-400 whitespace-nowrap">
                    <div>{item.submittedAt}</div>
                    {item.autoSubmitted && (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-500 dark:text-rose-400 mt-0.5">
                        ⏰ Hết giờ tự nộp
                      </span>
                    )}
                    {item.timeSpentFormatted && (
                      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        ⏱️ {item.timeSpentFormatted}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => exportSingleResultToExcel(item)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isDark ? 'text-cyan-400 hover:bg-slate-800' : 'text-emerald-700 hover:bg-emerald-100'
                        }`}
                        title="Tải file Excel cá nhân"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => onDeleteSingle(item.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                        title="Xóa kết quả này"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                  {results.length === 0 
                    ? 'Chưa có học sinh nào hoàn thành bài làm. Hãy làm bài để hệ thống tự động ghi nhận!'
                    : 'Không tìm thấy kết quả phù hợp với từ khóa tìm kiếm.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal for Clearing All */}
      {showConfirmClear && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`rounded-3xl p-6 max-w-md w-full shadow-2xl border ${
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-100 text-slate-800'
            }`}
          >
            <div className="flex items-center gap-3 text-rose-500 mb-3">
              <AlertTriangle size={28} />
              <h3 className="text-lg font-black">Xác nhận xóa danh sách?</h3>
            </div>
            <p className={`text-xs sm:text-sm mb-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Bạn có chắc chắn muốn xóa toàn bộ ({results.length}) kết quả học sinh trong danh sách? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmClear(false)}
                className={`px-4 py-2 rounded-xl border text-xs font-bold cursor-pointer ${
                  isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAll();
                  setShowConfirmClear(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs cursor-pointer shadow-md shadow-rose-600/30"
              >
                Xác nhận xóa tất cả
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Cài Đặt SQL Supabase */}
      {showSqlModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`rounded-3xl p-6 max-w-2xl w-full shadow-2xl border max-h-[85vh] flex flex-col ${
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-100 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/30">
                  <Database size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black">Cài Đặt Bảng Supabase</h3>
                  <p className="text-xs text-slate-400">
                    Chạy mã lệnh SQL này tại mục <b>SQL Editor</b> trên Supabase Dashboard
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="my-4 flex-1 overflow-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500">Mã SQL tạo 2 bảng `player_logins` & `student_results`:</span>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {hasCopiedSql ? <Check size={14} /> : <Copy size={14} />}
                  <span>{hasCopiedSql ? 'Đã sao chép!' : 'Sao chép mã SQL'}</span>
                </button>
              </div>

              <pre className="p-3.5 rounded-2xl bg-slate-950 text-emerald-400 text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed select-all">
                {SUPABASE_SETUP_SQL}
              </pre>

              <div className="mt-3 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-[11px] text-cyan-700 dark:text-cyan-300">
                💡 <b>Các bước thực hiện nhanh:</b>
                <ol className="list-decimal list-inside mt-1 space-y-0.5">
                  <li>Vào Supabase Dashboard của dự án của bạn (<span className="font-mono text-emerald-500">{SUPABASE_URL}</span>)</li>
                  <li>Chọn mục <b>SQL Editor</b> ở thanh menu bên trái</li>
                  <li>Nhấn <b>New Query</b>, dán mã SQL ở trên vào và bấm <b>Run</b></li>
                </ol>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
