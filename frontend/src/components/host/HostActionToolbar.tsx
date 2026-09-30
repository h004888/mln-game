'use client';

import React, { useEffect } from 'react';
import { GameState } from '../../types/game';
import { Bell, RotateCcw, Award, Play } from 'lucide-react';

interface HostActionToolbarProps {
  gameState: GameState;
  onOpenBuzzer: () => void;
  onResetBuzzer: () => void;
  onForceEnd: () => void;
}

export const HostActionToolbar: React.FC<HostActionToolbarProps> = ({
  gameState,
  onOpenBuzzer,
  onResetBuzzer,
  onForceEnd,
}) => {
  // Shortcut: Nhấn Spacebar để mở chuông nhanh (chỉ khi không ở trong ô soạn thảo và không lặp phím)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName;
      const isEditable =
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        tagName === 'SELECT' ||
        target?.isContentEditable;

      if (e.code === 'Space' && !isEditable) {
        e.preventDefault();
        onOpenBuzzer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenBuzzer]);

  return (
    <div className="glass-panel p-4 rounded-3xl border border-gray-700/80 shadow-2xl flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenBuzzer}
          className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black rounded-2xl flex items-center gap-2 shadow-lg transition-transform transform active:scale-95 text-xs sm:text-sm uppercase tracking-wider"
        >
          <Bell className="w-4 h-4" />
          <span>MỞ LƯỢT CHUÔNG [Space]</span>
        </button>

        <button
          onClick={onResetBuzzer}
          className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold rounded-2xl flex items-center gap-2 border border-gray-700 transition-transform transform active:scale-95 text-xs sm:text-sm"
        >
          <RotateCcw className="w-4 h-4 text-amber-400" />
          <span>Reset Chuông</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onForceEnd}
          className="px-4 py-3 bg-red-950/80 hover:bg-red-900 border border-red-500/60 text-red-200 font-bold rounded-2xl flex items-center gap-2 transition-transform transform active:scale-95 text-xs sm:text-sm"
        >
          <Award className="w-4 h-4 text-red-400" />
          <span>Lật Hết Ảnh & Trao Giải</span>
        </button>
      </div>
    </div>
  );
};
