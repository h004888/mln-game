'use client';

import React from 'react';

interface AnswerButtonsProps {
  options: string[];
  onSelectAnswer: (index: number) => void;
  disabled?: boolean;
}

const OPTION_THEMES = [
  { letter: 'A', bg: 'bg-red-600 hover:bg-red-500 active:bg-red-700', border: 'border-red-400', badge: 'bg-red-900 text-red-200' },
  { letter: 'B', bg: 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700', border: 'border-blue-400', badge: 'bg-blue-900 text-blue-200' },
  { letter: 'C', bg: 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700', border: 'border-amber-400', badge: 'bg-amber-900 text-amber-200' },
  { letter: 'D', bg: 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700', border: 'border-emerald-400', badge: 'bg-emerald-900 text-emerald-200' },
];

export const AnswerButtons: React.FC<AnswerButtonsProps> = ({
  options,
  onSelectAnswer,
  disabled = false,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md mx-auto">
      {options.map((opt, idx) => {
        const theme = OPTION_THEMES[idx] || OPTION_THEMES[0];
        return (
          <button
            key={idx}
            disabled={disabled}
            onClick={() => onSelectAnswer(idx)}
            className={`p-4 rounded-xl border-2 ${theme.border} ${theme.bg} text-white font-bold flex items-center gap-3 text-left transition-all duration-100 transform active:scale-95 shadow-lg disabled:opacity-50 disabled:pointer-events-none`}
          >
            <span className={`w-8 h-8 rounded-lg ${theme.badge} flex items-center justify-center font-black text-sm shrink-0`}>
              {theme.letter}
            </span>
            <span className="text-sm sm:text-base leading-snug break-words flex-1">
              {opt}
            </span>
          </button>
        );
      })}
    </div>
  );
};
