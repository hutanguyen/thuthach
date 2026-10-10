import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface Props {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  className?: string;
}

export const ThemeToggle: React.FC<Props> = ({ theme, onToggleTheme, className = '' }) => {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={onToggleTheme}
      className={`px-3.5 py-2 rounded-2xl flex items-center gap-2 font-bold text-xs shadow-lg transition-all border cursor-pointer select-none ${
        isDark
          ? 'bg-slate-800/95 text-amber-300 border-slate-700 hover:bg-slate-700 shadow-cyan-950/50'
          : 'bg-white/95 text-amber-600 border-amber-200 hover:bg-amber-50 shadow-amber-200/50'
      } ${className}`}
      title={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
      aria-label="Chuyển đổi giao diện Sáng và Tối"
    >
      {isDark ? (
        <>
          <Sun size={17} className="text-amber-400 animate-spin-slow" />
          <span>Giao diện Sáng</span>
        </>
      ) : (
        <>
          <Moon size={17} className="text-indigo-600" />
          <span className="text-neutral-700">Giao diện Tối</span>
        </>
      )}
    </button>
  );
};
