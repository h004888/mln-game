'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Crown, Sparkles } from 'lucide-react';

interface WinnerCelebrationProps {
  winnerName: string;
  secretKeyword: string;
  secretImageUrl: string;
}

export const WinnerCelebration: React.FC<WinnerCelebrationProps> = ({
  winnerName,
  secretKeyword,
  secretImageUrl,
}) => {
  useEffect(() => {
    // Launch fireworks
    const duration = 5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 z-50 animate-fadeIn">
      <div className="glass-panel border-4 border-game-neonGold rounded-3xl max-w-2xl w-full p-8 text-center space-y-6 shadow-[0_0_80px_rgba(255,215,0,0.6)] relative overflow-hidden">
        <div className="flex items-center justify-center gap-3 text-game-neonGold">
          <Sparkles className="w-8 h-8 animate-spin" />
          <Crown className="w-14 h-14 animate-bounce" />
          <Sparkles className="w-8 h-8 animate-spin" />
        </div>

        <div className="space-y-2">
          <span className="bg-game-neonGold text-black font-black text-xs px-4 py-1.5 rounded-full uppercase tracking-widest">
            🏆 NHÀ VÔ ĐỊCH CHUNG CUỘC (MVP)
          </span>
          <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
            {winnerName || 'NGƯỜI CHIẾN THẮNG'}
          </h1>
          <p className="text-sm text-gray-300">
            Đã xuất sắc giải mã chính xác bức ảnh bí ẩn:
          </p>
          <div className="text-2xl sm:text-3xl font-black text-game-neonCyan uppercase tracking-wider">
            &ldquo;{secretKeyword}&rdquo;
          </div>
        </div>

        <div className="relative rounded-2xl overflow-hidden border-2 border-game-neonGold/60 shadow-2xl max-h-64 mx-auto aspect-video">
          <img
            src={secretImageUrl}
            alt={secretKeyword}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};
