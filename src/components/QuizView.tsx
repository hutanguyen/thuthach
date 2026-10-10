import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, CheckCircle, Sparkles, Award, ZoomIn, Timer, Hourglass, Clock } from 'lucide-react';
import { Question, QuizTimerConfig } from '../types';
import { soundEngine } from '../utils/soundEngine';
import { ImageModal } from './ImageModal';

interface Props {
  questions: Question[];
  currentQuestionIndex: number;
  setCurrentQuestionIndex: React.Dispatch<React.SetStateAction<number>>;
  answers: Record<number, number>;
  onSelectOption: (questionId: number, optionIndex: number) => void;
  onSubmitQuiz: (isAutoSubmitted?: boolean, timeSpentSec?: number) => void;
  theme?: 'light' | 'dark';
  timerConfig?: QuizTimerConfig;
  quizStartedAt?: number | null;
}

const OPTION_COLORS = [
  { label: 'A', bgLight: 'bg-sky-500', textLight: 'text-sky-500', borderLight: 'border-sky-300', activeBg: 'bg-sky-50' },
  { label: 'B', bgLight: 'bg-emerald-500', textLight: 'text-emerald-500', borderLight: 'border-emerald-300', activeBg: 'bg-emerald-50' },
  { label: 'C', bgLight: 'bg-amber-500', textLight: 'text-amber-500', borderLight: 'border-amber-300', activeBg: 'bg-amber-50' },
  { label: 'D', bgLight: 'bg-purple-500', textLight: 'text-purple-500', borderLight: 'border-purple-300', activeBg: 'bg-purple-50' },
];

export const QuizView: React.FC<Props> = ({
  questions,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  answers,
  onSelectOption,
  onSubmitQuiz,
  theme = 'light',
  timerConfig,
  quizStartedAt,
}) => {
  const isDark = theme === 'dark';
  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progressPercent = Math.round(((currentQuestionIndex + 1) / questions.length) * 100);
  const [viewingImage, setViewingImage] = useState<{ url: string; title: string } | null>(null);

  // Timer setup and countdown state
  const totalDurationSeconds = useMemo(() => {
    if (!timerConfig || !timerConfig.enabled) return 0;
    const mins = timerConfig.durationMinutes || 15;
    const secs = timerConfig.durationSeconds || 0;
    return Math.max(5, mins * 60 + secs);
  }, [timerConfig?.enabled, timerConfig?.durationMinutes, timerConfig?.durationSeconds]);

  const isTimerActive = !!timerConfig?.enabled && totalDurationSeconds > 0;

  // Giữ mốc thời gian bắt đầu cố định để khi đổi câu hỏi / chọn đáp án không bị reset lại
  const fallbackStartTimeRef = useRef<number>(Date.now());
  const effectiveStartTime = quizStartedAt || fallbackStartTimeRef.current;

  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    if (!isTimerActive) return totalDurationSeconds;
    const elapsed = Math.floor((Date.now() - effectiveStartTime) / 1000);
    return Math.max(0, totalDurationSeconds - elapsed);
  });

  const [isTimeUpModalOpen, setIsTimeUpModalOpen] = useState(false);
  const hasAutoSubmittedRef = useRef(false);
  const onSubmitQuizRef = useRef(onSubmitQuiz);

  useEffect(() => {
    onSubmitQuizRef.current = onSubmitQuiz;
  }, [onSubmitQuiz]);

  // Countdown timer effect - CHỈ chạy theo effectiveStartTime & totalDurationSeconds, không phụ thuộc vào onSubmitQuiz hay re-render
  useEffect(() => {
    if (!isTimerActive) return;

    const tick = () => {
      const elapsedSeconds = Math.floor((Date.now() - effectiveStartTime) / 1000);
      const remaining = Math.max(0, totalDurationSeconds - elapsedSeconds);
      setSecondsRemaining(remaining);

      // Nhắc nhở tích tắc khẩn cấp khi còn 10 giây cuối cùng
      if (remaining <= 10 && remaining > 0) {
        soundEngine.playUrgentTick();
      }

      // Hết giờ làm bài -> Tự động nộp bài!
      if (remaining <= 0) {
        if (!hasAutoSubmittedRef.current) {
          hasAutoSubmittedRef.current = true;
          soundEngine.playTimeUpAlert();
          setIsTimeUpModalOpen(true);
          // Cho hiển thị thông báo hết giờ 1.2 giây rồi tự động chuyển trang nộp bài
          setTimeout(() => {
            onSubmitQuizRef.current(true, totalDurationSeconds);
          }, 1200);
        }
      }
    };

    tick();
    const interval = setInterval(tick, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isTimerActive, totalDurationSeconds, effectiveStartTime]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLowTime = isTimerActive && secondsRemaining <= 60;
  const isMediumWarning = isTimerActive && !isLowTime && secondsRemaining <= totalDurationSeconds * 0.25;
  const timerPercent = totalDurationSeconds > 0
    ? Math.max(0, Math.min(100, Math.round((secondsRemaining / totalDurationSeconds) * 100)))
    : 100;

  const handleManualSubmit = () => {
    if (hasAutoSubmittedRef.current) return;
    const elapsed = Math.floor((Date.now() - effectiveStartTime) / 1000);
    onSubmitQuizRef.current(false, elapsed);
  };

  return (
    <motion.div
      key="quiz"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      className={`w-full max-w-3xl rounded-3xl shadow-2xl p-6 sm:p-8 border flex flex-col min-h-[520px] transition-colors duration-300 ${
        isDark
          ? 'bg-slate-900/95 border-slate-700/80 text-white shadow-cyan-950/40'
          : 'bg-white/95 border-emerald-100 text-slate-800 shadow-emerald-200/50'
      }`}
    >
      {/* Top Header & Progress */}
      <div className="mb-5">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <span className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
              isDark
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm'
            }`}>
              <Sparkles size={14} className="text-amber-400" />
              Câu {currentQuestionIndex + 1} / {questions.length}
            </span>

            <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              (Đã trả lời: {answeredCount}/{questions.length} câu)
            </span>
          </div>

          <span className={`font-black text-sm ${isDark ? 'text-cyan-400' : 'text-emerald-600'}`}>
            Tiến độ: {progressPercent}%
          </span>
        </div>

        {/* Playful Colorful Progress Track */}
        <div className={`h-3.5 w-full rounded-full overflow-hidden p-0.5 border ${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
        }`}>
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 shadow-sm"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.35 }}
          />
        </div>
      </div>

      {/* Countdown Timer Display (Hiển thị phía trên danh sách câu hỏi) */}
      {isTimerActive && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-4.5 p-3.5 sm:p-4 rounded-2xl border transition-all shadow-md relative overflow-hidden ${
            isLowTime
              ? 'bg-rose-500/15 border-rose-500/60 text-rose-600 dark:text-rose-300 dark:bg-rose-950/50 shadow-rose-500/20 ring-2 ring-rose-400/40 animate-pulse'
              : isMediumWarning
              ? 'bg-amber-500/15 border-amber-500/50 text-amber-800 dark:text-amber-200 dark:bg-amber-950/40 shadow-amber-500/10'
              : isDark
              ? 'bg-slate-800/90 border-cyan-800/70 text-cyan-300 shadow-cyan-950/30'
              : 'bg-emerald-50/90 border-emerald-200 text-emerald-800 shadow-emerald-200/40'
          }`}
        >
          {/* Subtle timer progress bar running along the top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-black/10 dark:bg-white/10">
            <motion.div
              className={`h-full transition-all duration-1000 ${
                isLowTime
                  ? 'bg-rose-500'
                  : isMediumWarning
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-emerald-400 to-cyan-400'
              }`}
              style={{ width: `${timerPercent}%` }}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-0.5">
            {/* Left: Timer status & label */}
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isLowTime
                  ? 'bg-rose-600 text-white animate-bounce'
                  : isMediumWarning
                  ? 'bg-amber-500 text-white'
                  : isDark
                  ? 'bg-cyan-950 border border-cyan-700 text-cyan-400'
                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              }`}>
                <Timer size={22} className={isLowTime ? 'animate-spin' : ''} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider">
                    Thời Gian Làm Bài Còn Lại
                  </span>
                  {isLowTime && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                      KHẨN CẤP
                    </span>
                  )}
                  {isMediumWarning && !isLowTime && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white">
                      CHÚ Ý
                    </span>
                  )}
                </div>
                <p className={`text-[11px] font-medium leading-tight ${
                  isLowTime ? 'text-rose-500 dark:text-rose-300 font-bold' : isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {isLowTime
                    ? 'Còn dưới 1 phút! Hãy nhanh chóng hoàn thành các câu hỏi.'
                    : 'Đồng hồ đếm ngược thời gian làm bài.'}
                </p>
              </div>
            </div>

            {/* Right: Large digital clock display */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              <div className={`px-4 py-1.5 rounded-xl font-mono font-black text-xl sm:text-2xl tracking-wider shadow-sm border flex items-center gap-2 ${
                isLowTime
                  ? 'bg-rose-600 text-white border-rose-700 shadow-rose-900/40 ring-2 ring-rose-400/50'
                  : isMediumWarning
                  ? 'bg-amber-500 text-white border-amber-600 shadow-amber-900/30'
                  : isDark
                  ? 'bg-slate-900 text-cyan-300 border-cyan-800'
                  : 'bg-white text-emerald-800 border-emerald-200'
              }`}>
                <Hourglass size={18} className={isLowTime ? 'animate-spin' : ''} />
                <span>{formatTime(secondsRemaining)}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Question Jump Dots */}
      <div className="flex flex-wrap gap-1.5 mb-5 pb-3.5 border-b border-slate-200/60 dark:border-slate-800">
        {questions.map((q, idx) => {
          const isAnswered = answers[q.id] !== undefined;
          const isCurrent = idx === currentQuestionIndex;

          return (
            <button
              key={q.id}
              onClick={() => setCurrentQuestionIndex(idx)}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-xs font-black transition-all flex items-center justify-center cursor-pointer ${
                isCurrent
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-400/40 ring-2 ring-emerald-300 scale-105'
                  : isAnswered
                  ? isDark
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700'
                    : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                  : isDark
                  ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
              title={`Chuyển đến câu ${idx + 1}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Question Content */}
      <div className="flex-grow flex flex-col justify-between">
        <div>
          <motion.h2
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            className={`text-lg sm:text-xl md:text-2xl font-black mb-4 leading-snug ${
              isDark ? 'text-white' : 'text-slate-800'
            }`}
          >
            {currentQuestion.question}
          </motion.h2>

          {/* Question Image (if attached) */}
          {currentQuestion.imageUrl && (
            <motion.div
              key={`q-img-${currentQuestionIndex}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-5 flex justify-center"
            >
              <div
                onClick={() => setViewingImage({ url: currentQuestion.imageUrl!, title: `Hình ảnh câu hỏi ${currentQuestionIndex + 1}` })}
                className={`relative group cursor-pointer rounded-2xl overflow-hidden border max-h-64 sm:max-h-72 shadow-md transition-all hover:scale-[1.01] ${
                  isDark ? 'border-slate-700 bg-slate-950/70 hover:border-cyan-500' : 'border-slate-200 bg-slate-50 hover:border-emerald-400'
                }`}
                title="Bấm để xem ảnh phóng to"
              >
                <img
                  src={currentQuestion.imageUrl}
                  alt={`Hình ảnh câu hỏi ${currentQuestionIndex + 1}`}
                  className="max-h-60 sm:max-h-68 w-auto object-contain mx-auto p-1 rounded-2xl"
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold backdrop-blur-[1px]">
                  <ZoomIn size={16} />
                  <span>Xem ảnh phóng to</span>
                </div>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = answers[currentQuestion.id] === idx;
              const colorInfo = OPTION_COLORS[idx % OPTION_COLORS.length];
              const optImg = currentQuestion.optionImages?.[idx];

              return (
                <motion.button
                  key={`${currentQuestionIndex}-${idx}`}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => onSelectOption(currentQuestion.id, idx)}
                  className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all font-bold text-sm sm:text-base flex flex-col justify-between text-left cursor-pointer shadow-sm ${
                    isSelected
                      ? isDark
                        ? 'border-cyan-400 bg-cyan-950/60 text-cyan-200 shadow-md ring-2 ring-cyan-500/30'
                        : 'border-emerald-500 bg-emerald-50 text-emerald-950 shadow-md ring-2 ring-emerald-400/30'
                      : isDark
                      ? 'border-slate-800 bg-slate-800/60 hover:border-slate-700 hover:bg-slate-800 text-slate-200'
                      : 'border-slate-100 hover:border-emerald-300 hover:bg-slate-50 text-slate-700 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3 w-full">
                    <span
                      className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black transition-colors ${
                        isSelected
                          ? isDark
                            ? 'bg-cyan-500 text-slate-900 shadow-sm'
                            : 'bg-emerald-600 text-white shadow-sm'
                          : isDark
                          ? 'bg-slate-700 text-slate-300'
                          : `${colorInfo.bgLight} text-white`
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {option && <span className="flex-grow leading-snug">{option}</span>}
                    {isSelected && (
                      <CheckCircle size={22} className={isDark ? 'text-cyan-400 flex-shrink-0' : 'text-emerald-600 flex-shrink-0'} />
                    )}
                  </div>

                  {/* Option Image (if attached) */}
                  {optImg && (
                    <div className="mt-2.5 w-full flex justify-center">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingImage({ url: optImg, title: `Hình ảnh đáp án ${String.fromCharCode(65 + idx)}` });
                        }}
                        className={`relative group rounded-xl overflow-hidden border max-h-36 w-full flex justify-center items-center ${
                          isDark ? 'border-slate-700 bg-slate-900/80' : 'border-slate-200 bg-slate-50/80'
                        }`}
                        title="Bấm để xem ảnh đáp án phóng to"
                      >
                        <img
                          src={optImg}
                          alt={`Đáp án ${String.fromCharCode(65 + idx)}`}
                          className="max-h-32 w-auto object-contain p-1"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                          <ZoomIn size={14} />
                          <span>Phóng to</span>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-200/60 dark:border-slate-800 mt-auto">
          <button
            type="button"
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            className={`px-4 py-2.5 rounded-xl border font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:pointer-events-none ${
              isDark
                ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <ChevronLeft size={18} />
            <span>Câu trước</span>
          </button>

          <div className="flex gap-2">
            {!isLastQuestion ? (
              <button
                type="button"
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-400/30 transition-all flex items-center gap-1.5 cursor-pointer hover:opacity-95"
              >
                <span>Câu tiếp theo</span>
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleManualSubmit}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-400/40 transition-all flex items-center gap-2 cursor-pointer hover:opacity-95 border-b-2 border-emerald-700 active:border-b-0"
              >
                <Award size={18} />
                <span>Nộp bài & Xem kết quả</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Time-up Auto Submit Notification Overlay */}
      <AnimatePresence>
        {isTimeUpModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className={`p-6 sm:p-8 rounded-3xl max-w-md w-full shadow-2xl text-center border ${
                isDark ? 'bg-slate-900 border-rose-700/80 text-white shadow-rose-950/50' : 'bg-white border-rose-200 text-slate-800 shadow-rose-200/50'
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-4 ring-8 ring-rose-500/20 animate-bounce">
                <Timer size={36} />
              </div>
              <h3 className="text-xl sm:text-2xl font-black mb-2 text-rose-600 dark:text-rose-400">
                HẾT GIỜ LÀM BÀI!
              </h3>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-4">
                Thời gian làm bài cho bộ đề này đã kết thúc. Hệ thống đang tự động nộp bài và tổng hợp kết quả của bạn...
              </p>
              <div className="flex items-center justify-center gap-2.5 text-xs font-black text-rose-600 dark:text-rose-400">
                <span className="animate-spin inline-block w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full" />
                <span>Đang hoàn tất nộp bài thi...</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-resolution Image Modal */}
      <ImageModal
        isOpen={!!viewingImage}
        imageUrl={viewingImage?.url || null}
        title={viewingImage?.title}
        onClose={() => setViewingImage(null)}
      />
    </motion.div>
  );
};
