'use client';

import React from 'react';
import { Card } from '../../types/game';

interface BoardGridProps {
  cards: Card[];
  secretImageUrl: string;
  activeCardIndex?: number | null;
}

export const BoardGrid: React.FC<BoardGridProps> = ({
  cards,
  secretImageUrl,
  activeCardIndex,
}) => {
  return (
    <div className="grid grid-cols-4 gap-3.5 w-full aspect-square max-w-[620px] mx-auto p-3 glass-panel rounded-3xl border border-gray-700/80 shadow-2xl relative">
      {cards.map((card, idx) => {
        const row = Math.floor(idx / 4);
        const col = idx % 4;
        const bgPosX = `${(col / 3) * 100}%`;
        const bgPosY = `${(row / 3) * 100}%`;
        const isActive = activeCardIndex === card.index;

        return (
          <div
            key={card.id}
            className={`aspect-square rounded-2xl relative overflow-hidden transition-all duration-500 transform ${
              isActive
                ? 'scale-105 ring-4 ring-game-neonCyan z-20 shadow-[0_0_25px_rgba(0,245,255,0.8)]'
                : 'hover:scale-[1.02]'
            }`}
          >
            {card.isOpened ? (
              /* Opened Card: Shows corresponding portion of secret image */
              <div
                className="w-full h-full relative border border-cyan-400/40 rounded-2xl shadow-inner group flex flex-col justify-end p-2"
                style={{
                  backgroundImage: `url(${secretImageUrl})`,
                  backgroundSize: '400% 400%',
                  backgroundPosition: `${bgPosX} ${bgPosY}`,
                  backgroundRepeat: 'no-repeat',
                }}
              >
                <div className="absolute inset-0 bg-black/15 group-hover:bg-transparent transition-colors" />
                {card.openedBy && (
                  <span className="relative z-10 bg-black/75 backdrop-blur-sm text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded-md truncate border border-cyan-500/30">
                    {card.openedBy}
                  </span>
                )}
              </div>
            ) : (
              /* Unopened Card: Dark Neon Block */
              <div
                className={`w-full h-full flex flex-col items-center justify-center rounded-2xl border-2 transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-br from-cyan-900 to-blue-900 border-game-neonCyan text-white animate-pulse'
                    : 'bg-gradient-to-br from-[#121724] to-[#1a2236] border-gray-700/80 text-gray-200 hover:border-gray-500 shadow-lg'
                }`}
              >
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-tighter">
                  {card.index}
                </span>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                  Ô thẻ
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
