import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Lock, User, Eye, EyeOff, ArrowLeft, AlertCircle, LogIn } from 'lucide-react';

interface Props {
  onLoginSuccess: () => void;
  onBack: () => void;
  theme?: 'light' | 'dark';
}

export const AdminLogin: React.FC<Props> = ({ onLoginSuccess, onBack, theme = 'light' }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const isDark = theme === 'dark';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedUser = username.trim();
    if (trimmedUser === 'admin' && password === '02768') {
      onLoginSuccess();
    } else {
      setErrorMessage('Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại!');
    }
  };

  return (
    <motion.div
      key="admin-login"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className={`w-full max-w-md rounded-3xl shadow-2xl p-7 sm:p-9 border relative my-auto transition-colors duration-300 ${
        isDark
          ? 'bg-slate-900/95 border-slate-700/80 text-white shadow-cyan-950/50'
          : 'bg-white border-emerald-100 text-slate-800 shadow-emerald-200/50'
      }`}
    >
      <button
        type="button"
        onClick={onBack}
        className={`inline-flex items-center gap-1.5 text-xs font-bold transition-colors mb-5 cursor-pointer ${
          isDark ? 'text-slate-400 hover:text-cyan-400' : 'text-slate-500 hover:text-emerald-700'
        }`}
      >
        <ArrowLeft size={16} /> Quay lại trang làm bài
      </button>

      <div className="flex justify-center mb-3">
        <div className={`p-4 rounded-3xl shadow-inner ${
          isDark ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
        }`}>
          <ShieldCheck size={42} />
        </div>
      </div>

      <h1 className="text-2xl font-black text-center tracking-tight mb-6">
        Đăng Nhập Quản Trị
      </h1>

      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2.5"
        >
          <AlertCircle size={18} className="flex-shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
            <User size={15} className="text-emerald-500" /> Tên đăng nhập
          </label>
          <input
            type="text"
            required
            autoFocus
            placeholder="Nhập tên đăng nhập..."
            value={username}
            onChange={e => {
              setUsername(e.target.value);
              if (errorMessage) setErrorMessage('');
            }}
            onInvalid={e => (e.target as HTMLInputElement).setCustomValidity('Vui lòng điền thông tin vào ô này.')}
            onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
            className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none transition-all ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-400'
                : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-400'
            }`}
          />
        </div>

        <div>
          <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
            <Lock size={15} className="text-emerald-500" /> Mật khẩu
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Nhập mật khẩu..."
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              onInvalid={e => (e.target as HTMLInputElement).setCustomValidity('Vui lòng điền thông tin vào ô này.')}
              onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
              className={`w-full pl-4 pr-11 py-3 rounded-2xl border text-sm font-medium outline-none transition-all ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-400'
                  : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-400'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
              tabIndex={-1}
              title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-400/30 mt-2 text-sm cursor-pointer border-b-2 border-emerald-700 active:border-b-0"
        >
          <LogIn size={18} />
          <span>Đăng nhập vào Quản Trị</span>
        </button>
      </form>
    </motion.div>
  );
};
