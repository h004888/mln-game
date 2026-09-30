'use client';

import React from 'react';

interface BigTimerBarProps {
  remainingSeconds: number | null;
  totalDuration?: number;
  label?: string;
}

export const BigTimerBar: React.FC<BigTimerBarProps> = ({
  remainingSeconds,
  totalDuration = 15,
  label = 'Thời gian còn lại',
}) => {
  if (remainingSeconds === null) return null;

  const percentage = Math.max(0, Math.min(100, (remainingSeconds / totalDuration) * 100));
  const isUrgent = remainingSeconds <= 4;

  return (
    <div className="w-full glass-panel p-4 rounded-2xl border border-gray-700/80 shadow-lg space-y-2">
      <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider">
        <span className="text-gray-300">{label}</span>
        <span
          className={`px-3 py-1 rounded-full font-mono text-sm ${
            isUrgent ? 'bg-red-600 text-white animate-ping' : 'bg-game-neonCyan/20 text-game-neonCyan'
          }`}
        >
          {remainingSeconds} GIÂY
        </span>
      </div>

      <div className="w-full h-3.5 bg-gray-950 rounded-full overflow-hidden p-0.5 border border-gray-800">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            isUrgent
              ? 'bg-gradient-to-r from-red-600 to-rose-500'
              : 'bg-gradient-to-r from-game-neonCyan via-blue-500 to-indigo-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
