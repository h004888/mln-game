'use client';

import React from 'react';
import { CheckCircle2, XCircle, Flame } from 'lucide-react';

interface UltimateGuessReviewModalProps {
  pendingGuess: {
    playerId: string;
    playerName: string;
    keyword: string;
  } | null;
  secretKeyword: string;
  onReview: (isApproved: boolean) => void;
}

export const UltimateGuessReviewModal: React.FC<UltimateGuessReviewModalProps> = ({
  pendingGuess,
  secretKeyword,
  onReview,
}) => {
  if (!pendingGuess) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="glass-panel border-4 border-game-neonGold rounded-3xl max-w-md w-full p-6 space-y-5 shadow-[0_0_50px_rgba(255,215,0,0.5)]">
        <div className="flex items-center gap-2 text-game-neonGold font-black uppercase text-sm border-b border-gray-700 pb-3">
          <Flame className="w-6 h-6 animate-bounce text-amber-400" />
          <span>⚡ YÊU CẦU DUYỆT ĐOÁN ẢNH BÍ ẨN</span>
        </div>

        <div className="space-y-3 bg-gray-900/80 p-4 rounded-2xl border border-gray-800">
          <div>
            <span className="text-xs text-gray-400 font-medium">Người chơi gửi đáp án:</span>
            <div className="text-base font-black text-white">{pendingGuess.playerName}</div>
          </div>

          <div>
            <span className="text-xs text-gray-400 font-medium">Đáp án người chơi nhập:</span>
            <div className="text-xl font-black text-game-neonCyan font-mono bg-black/50 p-2.5 rounded-xl border border-cyan-500/30 break-words">
              &ldquo;{pendingGuess.keyword}&rdquo;
            </div>
          </div>

          <div>
            <span className="text-xs text-gray-400 font-medium">Từ khóa gốc của ảnh:</span>
            <div className="text-sm font-bold text-game-neonGold">
              {secretKeyword}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => onReview(false)}
            className="py-3.5 bg-red-900/80 hover:bg-red-800 border border-red-500/60 text-red-200 font-black rounded-2xl flex items-center justify-center gap-2 transition-transform transform active:scale-95 text-xs sm:text-sm uppercase shadow-lg"
          >
            <XCircle className="w-5 h-5 text-red-400" />
            <span>❌ SAI (Đóng Băng)</span>
          </button>

          <button
            onClick={() => onReview(true)}
            className="py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-transform transform active:scale-95 text-xs sm:text-sm uppercase shadow-[0_0_20px_rgba(16,185,129,0.5)]"
          >
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span>✅ ĐÚNG (TRAO CÚP)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
