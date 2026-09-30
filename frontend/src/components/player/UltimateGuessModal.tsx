'use client';

import React, { useState } from 'react';
import { Flame, X } from 'lucide-react';

interface UltimateGuessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitGuess: (keyword: string) => void;
}

export const UltimateGuessModal: React.FC<UltimateGuessModalProps> = ({
  isOpen,
  onClose,
  onSubmitGuess,
}) => {
  const [guess, setGuess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guess.trim().length > 0) {
      onSubmitGuess(guess.trim());
      setGuess('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="glass-panel border-game-neonGold border-2 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-[0_0_30px_rgba(255,215,0,0.4)]">
        <div className="flex items-center justify-between border-b border-gray-700 pb-3">
          <div className="flex items-center gap-2 text-game-neonGold font-black">
            <Flame className="w-5 h-5 animate-bounce" />
            <span className="text-base tracking-wider uppercase">Đoán Ảnh Bí Ẩn</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-amber-950/40 border border-amber-500/40 p-3 rounded-xl text-xs text-amber-200 space-y-1">
          <p className="font-bold">⚡ QUY TẮC ĐỘT PHÁ (INSTANT WIN):</p>
          <p>• Đúng: <strong>THẮNG CUỘC NGAY LẬP TỨC!</strong></p>
          <p>• Sai: <strong>Bị đóng băng 2 lượt</strong> bấm chuông tiếp theo.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-300 font-semibold mb-1">
              Nhập từ khóa hình ảnh bạn đoán:
            </label>
            <input
              type="text"
              autoFocus
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="VD: Vịnh Hạ Long, Tháp Rùa..."
              className="w-full px-4 py-3 bg-gray-900 border border-game-neonGold/60 rounded-xl text-white font-bold placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-game-neonGold"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold text-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!guess.trim()}
              className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black rounded-xl font-black text-sm uppercase tracking-wide shadow-lg disabled:opacity-40"
            >
              Gửi Đoán Ngay!
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
