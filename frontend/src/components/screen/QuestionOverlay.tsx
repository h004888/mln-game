'use client';

import React from 'react';
import { Card } from '../../types/game';

interface QuestionOverlayProps {
  card: Card;
  activePlayerName?: string;
  isStealMode?: boolean;
}

const OPTION_THEMES = [
  { letter: 'A', bg: 'bg-red-950/80 text-red-100', border: 'border-red-500', badge: 'bg-red-600 text-white' },
  { letter: 'B', bg: 'bg-blue-950/80 text-blue-100', border: 'border-blue-500', badge: 'bg-blue-600 text-white' },
  { letter: 'C', bg: 'bg-amber-950/80 text-amber-100', border: 'border-amber-500', badge: 'bg-amber-600 text-white' },
  { letter: 'D', bg: 'bg-emerald-950/80 text-emerald-100', border: 'border-emerald-500', badge: 'bg-emerald-600 text-white' },
];

export const QuestionOverlay: React.FC<QuestionOverlayProps> = ({
  card,
  activePlayerName,
  isStealMode = false,
}) => {
  return (
    <div className="glass-panel border-2 border-game-neonCyan rounded-3xl p-6 shadow-[0_0_40px_rgba(0,245,255,0.3)] space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between border-b border-gray-700/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="bg-game-neonCyan text-black text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
            Ô SỐ {card.index}
          </span>
          {isStealMode && (
            <span className="bg-amber-500 text-black text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider animate-bounce">
              🔥 CƯỚP LƯỢT (+150đ)
            </span>
          )}
        </div>
        {activePlayerName && (
          <div className="text-xs text-cyan-300 font-bold">
            Người trả lời: <span className="text-white underline">{activePlayerName}</span>
          </div>
        )}
      </div>

      <h2 className="text-xl sm:text-2xl font-black text-white leading-relaxed">
        {card.question.text}
      </h2>

      <div className="grid grid-cols-2 gap-3.5">
        {card.question.options.map((opt, idx) => {
          const theme = OPTION_THEMES[idx] || OPTION_THEMES[0];
          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border-2 ${theme.border} ${theme.bg} flex items-center gap-3 shadow-md`}
            >
              <span className={`w-8 h-8 rounded-xl ${theme.badge} flex items-center justify-center font-black text-sm shrink-0`}>
                {theme.letter}
              </span>
              <span className="text-sm sm:text-base font-bold text-white">
                {opt}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
