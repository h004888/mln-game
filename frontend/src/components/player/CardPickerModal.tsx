'use client';

import React from 'react';
import { Card } from '../../types/game';

interface CardPickerModalProps {
  cards: Card[];
  onSelectCard: (index: number) => void;
  remainingSeconds: number | null;
}

export const CardPickerModal: React.FC<CardPickerModalProps> = ({
  cards,
  onSelectCard,
  remainingSeconds,
}) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="glass-panel border-game-neonCyan border-2 rounded-2xl max-w-sm w-full p-5 text-center space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-700 pb-3">
          <h3 className="text-lg font-black text-game-neonCyan uppercase tracking-wider">
            🎉 BẠN GIÀNH QUYỀN CHỌN Ô!
          </h3>
          {remainingSeconds !== null && (
            <span className="bg-red-600 text-white font-mono px-2.5 py-1 rounded-full text-xs font-bold animate-pulse">
              {remainingSeconds}s
            </span>
          )}
        </div>

        <p className="text-xs text-gray-300">
          Chạm vào 1 ô chưa mở bên dưới để nhận câu hỏi:
        </p>

        <div className="grid grid-cols-4 gap-2.5 max-h-72 overflow-y-auto p-1">
          {cards.map((card) => (
            <button
              key={card.id}
              disabled={card.isOpened}
              onClick={() => onSelectCard(card.index)}
              className={`aspect-square rounded-xl font-black text-base flex flex-col items-center justify-center transition-all transform duration-100 ${
                card.isOpened
                  ? 'bg-gray-800/50 text-gray-600 border border-gray-800 cursor-not-allowed'
                  : 'bg-gradient-to-br from-game-card to-game-border hover:from-cyan-900 hover:to-blue-900 border-2 border-game-neonCyan text-white active:scale-90 shadow-md'
              }`}
            >
              <span>{card.index}</span>
              {card.isOpened && <span className="text-[9px] text-gray-500 font-normal">Đã mở</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
