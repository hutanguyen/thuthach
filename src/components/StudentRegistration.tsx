import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, GraduationCap, ChevronRight, Sparkles, ShieldCheck, Hash, Bot } from 'lucide-react';
import { StudentInfo, QuizTimerConfig } from '../types';

interface Props {
  studentInfo: StudentInfo;
  setStudentInfo: React.Dispatch<React.SetStateAction<StudentInfo>>;
  onStartQuiz: (e: React.FormEvent) => void;
  onOpenAdmin: () => void;
  theme?: 'light' | 'dark';
  timerConfig?: QuizTimerConfig;
}

// 7 ngôi sao đa màu sắc chạy quanh logo
const ORBIT_STARS = [
  { color: '#FBBF24', size: 15, label: 'yellow' },
  { color: '#F43F5E', size: 13, label: 'pink' },
  { color: '#06B6D4', size: 14, label: 'cyan' },
  { color: '#A855F7', size: 15, label: 'purple' },
  { color: '#FB923C', size: 13, label: 'orange' },
  { color: '#10B981', size: 15, label: 'green' },
  { color: '#EF4444', size: 14, label: 'red' },
];

export const StudentRegistration: React.FC<Props> = ({
  studentInfo,
  setStudentInfo,
  onStartQuiz,
  onOpenAdmin,
  theme = 'light',
  timerConfig,
}) => {
  const isDark = theme === 'dark';
  const [participantType, setParticipantType] = useState<'student' | 'other'>(
    studentInfo.participantType || (studentInfo.studentClass === 'Khác' && !studentInfo.studentCode ? 'other' : 'student')
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (participantType === 'other') {
      setStudentInfo(prev => ({
        ...prev,
        participantType: 'other',
        studentCode: '',
        studentClass: '',
      }));
    } else {
      setStudentInfo(prev => ({
        ...prev,
        participantType: 'student',
      }));
    }
    onStartQuiz(e);
  };

  return (
    <motion.div
      key="registration"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`w-full max-w-lg rounded-3xl shadow-2xl p-7 sm:p-9 border relative my-auto transition-colors duration-300 overflow-hidden ${
        isDark
          ? 'bg-slate-900/90 border-slate-700/80 shadow-cyan-950/40 text-white'
          : 'bg-white/95 border-emerald-100 shadow-emerald-200/50 text-slate-800'
      }`}
    >
      {/* Decorative playful tech floaters for primary school kids */}
      <div className="absolute -top-6 -right-6 w-28 h-28 bg-gradient-to-br from-amber-400 to-pink-500 rounded-full blur-2xl opacity-20 pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-tr from-cyan-400 to-emerald-500 rounded-full blur-2xl opacity-20 pointer-events-none" />

      {/* Top Bar with Admin button (Bên trái, ở trên) */}
      <div className="flex justify-start items-center mb-4 relative z-10">
        <button
          type="button"
          onClick={onOpenAdmin}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            isDark
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-cyan-500 shadow-sm'
              : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border-slate-200 hover:border-emerald-300 shadow-sm'
          }`}
          title="Khu vực Quản trị: Quản lý câu hỏi và xem bảng tổng hợp kết quả"
        >
          <ShieldCheck size={15} className={isDark ? 'text-cyan-400' : 'text-emerald-600'} />
          <span>Quản Trị</span>
        </button>
      </div>

      {/* Green Title (Static, Above Logo) */}
      <div className="flex justify-center items-center select-none mb-4 px-1 text-center">
        <h1
          className={`text-[1.65rem] sm:text-[2.1rem] font-black tracking-wide green-title-font ${
            isDark ? 'green-title-layer-top-dark' : 'green-title-layer-top'
          }`}
        >
          HỆ THỐNG THỬ THÁCH
        </h1>
      </div>

      {/* Playful 3D Mascot with 7 Orbiting Colorful Stars */}
      <div className="flex justify-center mb-4 relative py-2">
        <div className="relative flex items-center justify-center">
          {/* 7 Ngôi sao đủ màu sắc chạy xung quanh logo */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8.5, ease: 'linear' }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            {ORBIT_STARS.map((star, i) => {
              const angleDeg = (i * 360) / 7;
              const radius = 56; // Bán kính quỹ đạo quanh logo
              const x = radius * Math.cos((angleDeg * Math.PI) / 180);
              const y = radius * Math.sin((angleDeg * Math.PI) / 180);
              return (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  animate={{
                    scale: [0.9, 1.25, 0.9],
                    rotate: [0, -360],
                  }}
                  transition={{
                    scale: {
                      duration: 1.5 + (i % 3) * 0.35,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    },
                    rotate: {
                      duration: 8.5,
                      repeat: Infinity,
                      ease: 'linear',
                    },
                  }}
                >
                  <svg
                    width={star.size}
                    height={star.size}
                    viewBox="0 0 24 24"
                    fill={star.color}
                    className="drop-shadow-md"
                    style={{
                      filter: `drop-shadow(0 0 5px ${star.color})`,
                    }}
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Logo Robot chính giữa */}
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
            className={`p-4 rounded-3xl shadow-xl flex items-center justify-center border-2 relative z-10 ${
              isDark
                ? 'bg-gradient-to-br from-cyan-500/20 to-indigo-600/30 border-cyan-400/40 text-cyan-300 shadow-cyan-900/40'
                : 'bg-gradient-to-br from-amber-100 via-orange-100 to-yellow-100 border-amber-300/80 text-amber-600 shadow-amber-200/60'
            }`}
          >
            <Bot size={44} className="drop-shadow-md" />
          </motion.div>
        </div>
      </div>

      {/* 2 Radio buttons phía dưới logo: Học sinh & Khác */}
      <div className="flex items-center justify-center gap-7 mb-5 select-none">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="radio"
            name="participantType"
            value="student"
            checked={participantType === 'student'}
            onChange={() => {
              setParticipantType('student');
              setStudentInfo(prev => ({
                ...prev,
                participantType: 'student',
                studentClass: prev.studentClass === 'Khác' ? '' : prev.studentClass,
              }));
            }}
            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
          />
          <span className={`text-sm transition-colors ${
            participantType === 'student'
              ? isDark ? 'text-emerald-400 font-extrabold' : 'text-emerald-700 font-extrabold'
              : isDark ? 'text-slate-300 font-bold' : 'text-slate-600 font-bold'
          }`}>
            Học sinh
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="radio"
            name="participantType"
            value="other"
            checked={participantType === 'other'}
            onChange={() => {
              setParticipantType('other');
              setStudentInfo(prev => ({
                ...prev,
                participantType: 'other',
                studentCode: '',
                studentClass: '',
              }));
            }}
            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
          />
          <span className={`text-sm transition-colors ${
            participantType === 'other'
              ? isDark ? 'text-emerald-400 font-extrabold' : 'text-emerald-700 font-extrabold'
              : isDark ? 'text-slate-300 font-bold' : 'text-slate-600 font-bold'
          }`}>
            Khác
          </span>
        </label>
      </div>

      {/* Form with Kid-Friendly Tech Aesthetics */}
      <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
        {participantType === 'student' ? (
          <>
            {/* Chế độ Học sinh: 3 trường như hình mẫu */}
            <div>
              <label className={`block text-xs font-extrabold uppercase tracking-wider mb-1.5 flex items-center gap-2 ${
                isDark ? 'text-slate-200' : 'text-slate-700'
              }`}>
                <User size={15} className="text-emerald-500" />
                HỌ VÀ TÊN HỌC SINH <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="text"
                placeholder="Nhập họ và tên của bạn..."
                className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none transition-all shadow-sm ${
                  isDark
                    ? 'bg-slate-800/90 border-slate-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400'
                    : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400'
                }`}
                value={studentInfo.name}
                onChange={e => setStudentInfo({ ...studentInfo, name: e.target.value })}
                onInvalid={e => (e.target as HTMLInputElement).setCustomValidity('Vui lòng điền thông tin vào ô này.')}
                onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className={`block text-xs font-extrabold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${
                  isDark ? 'text-slate-200' : 'text-slate-700'
                }`}>
                  <Hash size={15} className="text-cyan-500" />
                  SỐ THỨ TỰ / MÃ SỐ <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ví dụ: 01 hoặc HS01..."
                  className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none transition-all shadow-sm ${
                    isDark
                      ? 'bg-slate-800/90 border-slate-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400'
                      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400'
                  }`}
                  value={studentInfo.studentCode}
                  onChange={e => setStudentInfo({ ...studentInfo, studentCode: e.target.value })}
                  onInvalid={e => (e.target as HTMLInputElement).setCustomValidity('Vui lòng điền thông tin vào ô này.')}
                  onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
                />
              </div>

              <div>
                <label className={`block text-xs font-extrabold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${
                  isDark ? 'text-slate-200' : 'text-slate-700'
                }`}>
                  <GraduationCap size={15} className="text-amber-500" />
                  LỚP <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ví dụ: 3A, 4B, 5C..."
                  className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none transition-all shadow-sm ${
                    isDark
                      ? 'bg-slate-800/90 border-slate-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400'
                      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400'
                  }`}
                  value={studentInfo.studentClass}
                  onChange={e => setStudentInfo({ ...studentInfo, studentClass: e.target.value })}
                  onInvalid={e => (e.target as HTMLInputElement).setCustomValidity('Vui lòng điền thông tin vào ô này.')}
                  onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
                />
              </div>
            </div>
          </>
        ) : (
          /* Chế độ Khác: Chỉ hiện textbox HỌ VÀ TÊN */
          <div>
            <label className={`block text-xs font-extrabold uppercase tracking-wider mb-1.5 flex items-center gap-2 ${
              isDark ? 'text-slate-200' : 'text-slate-700'
            }`}>
              <User size={15} className="text-emerald-500" />
              HỌ VÀ TÊN <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="text"
              placeholder="Nhập họ và tên của bạn..."
              className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none transition-all shadow-sm ${
                isDark
                  ? 'bg-slate-800/90 border-slate-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400'
                  : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400'
              }`}
              value={studentInfo.name}
              onChange={e => setStudentInfo({ ...studentInfo, name: e.target.value, studentClass: studentInfo.studentClass.trim() || 'Khác' })}
              onInvalid={e => (e.target as HTMLInputElement).setCustomValidity('Vui lòng điền thông tin vào ô này.')}
              onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
            />
          </div>
        )}

        {/* Start button with glowing 3D energetic kid style */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="w-full mt-3 py-4 rounded-2xl font-black text-white text-base tracking-wide flex items-center justify-center gap-2.5 shadow-xl transition-all bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-emerald-400/30 border-b-4 border-emerald-700 active:border-b-0 cursor-pointer"
        >
          <Sparkles size={20} className="animate-spin-slow" />
          <span>BẮT ĐẦU THỬ THÁCH</span>
          <ChevronRight size={20} />
        </motion.button>
      </form>

      {/* Decorative footer tags for kids */}
      <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-around text-xs font-bold text-slate-400">
        <span className="flex items-center gap-1">🌟 Tự tin làm bài</span>
        <span className="flex items-center gap-1">🚀 Báo điểm tức thì</span>
        <span className="flex items-center gap-1">🏆 Ghi nhận thành tích</span>
      </div>
    </motion.div>
  );
};
