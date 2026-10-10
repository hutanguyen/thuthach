import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

interface Props {
  theme?: 'light' | 'dark';
  className?: string;
}

export const SoundToggle: React.FC<Props> = ({ theme = 'light', className = '' }) => {
  const isDark = theme === 'dark';
  const [isPlaying, setIsPlaying] = useState<boolean>(() => soundEngine.isSoundEnabled());

  useEffect(() => {
    const unsubscribe = soundEngine.subscribe((active) => {
      setIsPlaying(active);
    });
    return () => unsubscribe();
  }, []);

  const handleToggle = () => {
    soundEngine.toggle();
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-all border cursor-pointer select-none relative group ${
        isPlaying
          ? isDark
            ? 'bg-slate-800/95 text-emerald-300 border-emerald-500/80 hover:bg-slate-700 shadow-emerald-950/50 hover:border-emerald-400'
            : 'bg-emerald-50/95 text-emerald-700 border-emerald-300 hover:bg-emerald-100 shadow-emerald-200/50 hover:border-emerald-400'
          : isDark
            ? 'bg-slate-800/95 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200 shadow-cyan-950/50'
            : 'bg-white/95 text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700 shadow-slate-200/50'
      } ${className}`}
      title={isPlaying ? 'Tắt âm thanh thám hiểm' : 'Bật âm thanh (phong cách thám hiểm)'}
      aria-label={isPlaying ? 'Tắt âm thanh' : 'Bật âm thanh'}
    >
      {isPlaying ? (
        <div className="relative flex items-center justify-center">
          <Volume2 size={19} className="text-emerald-500 transition-transform group-hover:scale-110" />
          {/* Vòng hào quang nhẹ báo hiệu nhạc đang phát */}
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500" />
        </div>
      ) : (
        <VolumeX size={19} className="text-slate-400 transition-transform group-hover:scale-110" />
      )}
    </button>
  );
};
