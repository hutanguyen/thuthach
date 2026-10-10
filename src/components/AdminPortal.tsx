import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Settings, 
  Table, 
  LogOut,
  Sun,
  Moon,
  Home
} from 'lucide-react';
import { Question, StudentResult, QuizTimerConfig } from '../types';
import { QuestionManager } from './QuestionManager';
import { SummaryDashboard } from './SummaryDashboard';
import { SoundToggle } from './SoundToggle';

interface Props {
  questions: Question[];
  onSaveQuestions: (newQuestions: Question[]) => void;
  onResetToDefault: () => void;
  results: StudentResult[];
  onClearAllResults: () => void;
  onDeleteSingleResult: (id: string) => void;
  onLogout: () => void;
  onBackToApp?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  timerConfig?: QuizTimerConfig;
  onSaveTimerConfig?: (config: QuizTimerConfig) => void;
}

export const AdminPortal: React.FC<Props> = ({
  questions,
  onSaveQuestions,
  onResetToDefault,
  results,
  onClearAllResults,
  onDeleteSingleResult,
  onLogout,
  onBackToApp,
  theme = 'light',
  onToggleTheme,
  timerConfig,
  onSaveTimerConfig,
}) => {
  const [adminTab, setAdminTab] = useState<'questions' | 'summary'>('questions');
  const isDark = theme === 'dark';

  return (
    <div className="w-full max-w-5xl my-auto space-y-4">
      {/* Admin Top Navigation Bar */}
      <div className={`rounded-3xl shadow-xl border p-4 sm:p-5 flex flex-col gap-4 transition-colors duration-300 ${
        isDark
          ? 'bg-slate-900/95 border-slate-700/80 text-white shadow-cyan-950/40'
          : 'bg-white border-emerald-100 text-slate-800 shadow-emerald-200/40'
      }`}>
        {/* Hàng trên cùng: [Trang chủ] ở bên trái (trên Quản Trị Hệ Thống), [Giao diện Tối/Sáng] ở bên phải */}
        <div className="flex items-center justify-between w-full">
          {/* Nút "Trang chủ" nền màu cam nhạt */}
          <button
            type="button"
            onClick={onBackToApp}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-2 font-bold text-xs shadow-sm transition-all border cursor-pointer ${
              isDark
                ? 'bg-orange-950/40 text-orange-300 border-orange-800/60 hover:bg-orange-900/50 hover:text-white'
                : 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100 hover:text-orange-900'
            }`}
            title="Quay lại Trang chủ"
            aria-label="Quay lại Trang chủ"
          >
            <Home size={15} className={isDark ? 'text-orange-400' : 'text-orange-600'} />
            <span>Trang chủ</span>
          </button>

          {/* Nút Âm thanh & Giao diện tối/sáng sang bên phải và ở trên */}
          <div className="flex items-center gap-2">
            <SoundToggle theme={theme} className="w-8 h-8 rounded-xl shadow-sm" />
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className={`px-3 py-1.5 rounded-xl flex items-center gap-2 font-bold text-xs shadow-sm transition-all border cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                }`}
                title={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
                aria-label="Chuyển đổi giao diện Sáng và Tối"
              >
                {isDark ? (
                  <>
                    <Sun size={15} className="text-amber-400" />
                    <span>Giao diện Sáng</span>
                  </>
                ) : (
                  <>
                    <Moon size={15} className="text-indigo-600" />
                    <span className="text-neutral-700">Giao diện Tối</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Hàng chính: Quản Trị Hệ Thống & hutanguyen + Đăng xuất bên trái, Tab Selection bên phải */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* Nhóm bên trái: Chữ "Quản Trị Hệ Thống" -> Hàng [hutanguyen] [Đăng xuất] */}
          <div className="flex flex-col items-start gap-2">
            {/* Chữ "Quản Trị Hệ Thống" */}
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-2xl flex items-center justify-center ${
                isDark ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                <ShieldCheck size={22} />
              </div>
              <h2 className="text-xl font-black tracking-tight">Quản Trị Hệ Thống</h2>
            </div>

            {/* Đưa "hutanguyen" xuống vị trí nút "Đăng xuất" và nút "Đăng xuất" nằm bên phải của "hutanguyen" */}
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${
                isDark ? 'bg-cyan-950 text-cyan-300 border-cyan-800' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                admin
              </span>

              <button
                type="button"
                onClick={onLogout}
                className={`px-3 py-1 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                  isDark
                    ? 'border-rose-900/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60'
                    : 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
                }`}
                title="Đăng xuất khỏi tài khoản quản trị"
              >
                <LogOut size={13} />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>

          {/* Tab Selection */}
          <div className={`flex items-center gap-1.5 p-1.5 rounded-2xl w-full md:w-auto border self-stretch md:self-center justify-center ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => setAdminTab('questions')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                adminTab === 'questions'
                  ? isDark
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                    : 'bg-white text-emerald-800 shadow-sm font-black'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings size={15} />
              <span>Quản Lý Câu Hỏi</span>
            </button>

            <button
              type="button"
              onClick={() => setAdminTab('summary')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                adminTab === 'summary'
                  ? isDark
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                    : 'bg-white text-emerald-800 shadow-sm font-black'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table size={15} />
              <span>Tổng Hợp Kết Quả</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Admin Content based on tab */}
      <div>
        {adminTab === 'questions' ? (
          <QuestionManager
            questions={questions}
            onSaveQuestions={onSaveQuestions}
            onResetToDefault={onResetToDefault}
            onBack={onBackToApp}
            theme={theme}
            timerConfig={timerConfig}
            onSaveTimerConfig={onSaveTimerConfig}
          />
        ) : (
          <SummaryDashboard
            results={results}
            onBack={onBackToApp}
            onClearAll={onClearAllResults}
            onDeleteSingle={onDeleteSingleResult}
            theme={theme}
          />
        )}
      </div>
    </div>
  );
};
