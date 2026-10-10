import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, User, GraduationCap, FileSpreadsheet, RefreshCcw, Award, Hash, Star, Timer, Clock } from 'lucide-react';
import { StudentResult } from '../types';
import { exportSingleResultToExcel } from '../utils/excelExport';
import { fireCelebrationConfetti } from '../utils/confetti';
import { soundEngine } from '../utils/soundEngine';

interface Props {
  result: StudentResult;
  onRestart: () => void;
  theme?: 'light' | 'dark';
}

export const ResultView: React.FC<Props> = ({ result, onRestart, theme = 'light' }) => {
  const isDark = theme === 'dark';
  const isOther = result.participantType === 'other' || (!result.studentCode && (result.studentClass === 'Khác' || !result.studentClass));

  // Kích hoạt pháo giấy và âm thanh chiến thắng khi vừa hiển thị màn hình chúc mừng
  useEffect(() => {
    fireCelebrationConfetti();
    soundEngine.playVictoryFanfare();
  }, []);

  const handleExportExcel = () => {
    exportSingleResultToExcel(result);
  };

  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden my-auto border transition-colors duration-300 ${
        isDark
          ? 'bg-slate-900 border-slate-700/80 text-white shadow-cyan-950/50'
          : 'bg-white border-emerald-100 text-slate-800 shadow-emerald-200/60'
      }`}
    >
      {/* Header Badge with Celebratory 3D Gradient */}
      <div className="bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 p-8 sm:p-10 text-center text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-15">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10, stiffness: 100, delay: 0.2 }}
          className="inline-block p-4 bg-white/20 rounded-3xl backdrop-blur-md mb-2 border border-white/30 shadow-xl"
        >
          <Trophy size={56} className="text-yellow-300 drop-shadow-lg animate-bounce" />
        </motion.div>

        {/* Fun & Impressive Animated "CHÚC MỪNG" with Interactive Confetti click */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 10, stiffness: 120, delay: 0.25 }}
          onClick={() => {
            fireCelebrationConfetti();
            soundEngine.playVictoryFanfare();
          }}
          className="flex items-center justify-center gap-2 sm:gap-3 my-1.5 select-none cursor-pointer group"
          title="Nhấn để bắn thêm pháo hoa giấy!"
        >
          {/* Party Sparkle Left */}
          <motion.span
            animate={{
              rotate: [-15, 15, -15],
              scale: [1, 1.25, 1],
              y: [0, -4, 0],
            }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="text-2xl sm:text-3xl filter drop-shadow-md group-hover:scale-130 transition-transform"
            aria-hidden="true"
          >
            🎉
          </motion.span>

          {/* Dancing Bouncy Letters */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-wider text-white inline-flex items-center drop-shadow-[0_4px_10px_rgba(0,0,0,0.35)] group-hover:drop-shadow-[0_4px_16px_rgba(255,255,255,0.7)] transition-all">
            {[
              { char: 'C', delay: 0 },
              { char: 'H', delay: 0.08 },
              { char: 'Ú', delay: 0.16 },
              { char: 'C', delay: 0.24 },
              { char: '\u00A0', delay: 0.32 },
              { char: 'M', delay: 0.4 },
              { char: 'Ừ', delay: 0.48 },
              { char: 'N', delay: 0.56 },
              { char: 'G', delay: 0.64 },
            ].map((item, index) =>
              item.char === '\u00A0' ? (
                <span key={index} className="inline-block w-2.5 sm:w-3.5" />
              ) : (
                <motion.span
                  key={index}
                  className="inline-block"
                  animate={{
                    y: [0, -9, 0],
                    rotate: [0, index % 2 === 0 ? -6 : 6, 0],
                    scale: [1, 1.15, 1],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.8,
                    delay: item.delay,
                    ease: 'easeInOut',
                  }}
                  style={{
                    textShadow: '0 3px 6px rgba(0,0,0,0.4), 0 0 14px rgba(255,255,255,0.45)',
                  }}
                >
                  {item.char}
                </motion.span>
              )
            )}
          </h1>

          {/* Party Sparkle Right */}
          <motion.span
            animate={{
              rotate: [15, -15, 15],
              scale: [1, 1.25, 1],
              y: [0, -4, 0],
            }}
            transition={{ repeat: Infinity, duration: 1.8, delay: 0.2, ease: 'easeInOut' }}
            className="text-2xl sm:text-3xl filter drop-shadow-md group-hover:scale-130 transition-transform"
            aria-hidden="true"
          >
            🎊
          </motion.span>
        </motion.div>

        <p className="text-emerald-100 text-xs sm:text-sm font-semibold opacity-95">
          Bạn đã hoàn thành thử thách !
        </p>
      </div>

      <div className="p-6 sm:p-8 space-y-5">
        {/* Student Info Bar */}
        <div className={`flex flex-wrap justify-between items-center gap-3 p-4 rounded-2xl border ${
          isDark
            ? 'bg-slate-800/80 border-slate-700 text-white'
            : 'bg-emerald-50/70 border-emerald-100 text-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              isDark ? 'bg-cyan-950 text-cyan-400' : 'bg-emerald-100 text-emerald-700'
            }`}>
              <User size={20} />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider">
                {isOther ? 'HỌ VÀ TÊN' : 'Học sinh'}
              </p>
              <p className="font-extrabold text-sm sm:text-base">{result.name}</p>
            </div>
          </div>

          {!isOther && (
            <div className="flex items-center gap-4">
              {result.studentCode && (
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl ${
                    isDark ? 'bg-cyan-950 text-cyan-400' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    <Hash size={16} />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider">STT / Mã số</p>
                    <p className="font-extrabold text-xs sm:text-sm">{result.studentCode}</p>
                  </div>
                </div>
              )}

              {result.studentClass && (
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl ${
                    isDark ? 'bg-cyan-950 text-cyan-400' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    <GraduationCap size={16} />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider">Lớp</p>
                    <p className="font-extrabold text-xs sm:text-sm">{result.studentClass}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Score Display Card */}
        <div className={`flex flex-col items-center py-5 rounded-2xl border p-6 text-center ${
          isDark
            ? 'bg-slate-800/50 border-slate-700'
            : 'bg-slate-50/80 border-slate-200/80'
        }`}>
          <span className="text-xs text-slate-400 font-black uppercase tracking-widest mb-1">
            Số câu trả lời đúng
          </span>
          <div className="flex items-baseline gap-2 my-1">
            <span className={`text-5xl sm:text-6xl font-black leading-none ${
              isDark ? 'text-cyan-400' : 'text-emerald-600'
            }`}>
              {result.score}
            </span>
            <span className="text-2xl text-slate-400 font-bold">/ {result.total}</span>
          </div>

          {/* Không hiển thị Label Xếp loại nếu chọn Radio button "Khác" */}
          {!isOther && (
            <div className={`mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-black text-sm border shadow-sm ${
              isDark
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
                : 'bg-emerald-100 text-emerald-800 border-emerald-200'
            }`}>
              <Award size={16} />
              <span>Xếp loại: {result.evaluation}</span>
            </div>
          )}

          {/* Không hiển thị Label "Tự động nộp bài khi hết giờ" */}

          {result.timeSpentFormatted && (
            <p className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
              <Clock size={13} />
              <span>Thời gian hoàn thành: {result.timeSpentFormatted}</span>
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-black transition-all shadow-lg shadow-emerald-400/30 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer border-b-2 border-emerald-700 active:border-b-0"
          >
            <FileSpreadsheet size={20} />
            <span>Xuất kết quả bài làm ra file Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className={`w-full py-3 px-4 rounded-2xl border font-extrabold transition-all flex items-center justify-center gap-2 text-sm cursor-pointer ${
              isDark
                ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <RefreshCcw size={18} />
            <span>Làm bài lại</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
