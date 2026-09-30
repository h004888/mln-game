'use client';

import React from 'react';
import { Player, PlayerRole } from '../../types/game';
import { Trophy, Medal, Award, Crown } from 'lucide-react';

interface LiveLeaderboardProps {
  players: Record<string, Player>;
}

export const LiveLeaderboard: React.FC<LiveLeaderboardProps> = ({ players }) => {
  const playerList = Object.values(players)
    .filter((p) => p.role === PlayerRole.PLAYER)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // Top 5

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 0:
        return <Crown className="w-5 h-5 text-game-neonGold animate-bounce" />;
      case 1:
        return <Medal className="w-5 h-5 text-slate-300" />;
      case 2:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 text-center text-xs font-bold text-gray-500">{rank + 1}</span>;
    }
  };

  return (
    <div className="glass-panel p-5 rounded-3xl border border-gray-700/80 shadow-2xl space-y-4">
      <div className="flex items-center gap-2 border-b border-gray-700/60 pb-3">
        <Trophy className="w-5 h-5 text-game-neonGold" />
        <h3 className="text-sm font-black text-white uppercase tracking-wider">
          Bảng Xếp Hạng Top 5
        </h3>
      </div>

      {playerList.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-4 italic">
          Chưa có người chơi tham gia phòng...
        </p>
      ) : (
        <div className="space-y-2.5">
          {playerList.map((player, idx) => (
            <div
              key={player.id}
              className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                idx === 0
                  ? 'bg-gradient-to-r from-amber-950/40 to-yellow-900/20 border-game-neonGold/50 shadow-md'
                  : 'bg-gray-900/60 border-gray-800'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0">{getRankBadge(idx)}</div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-white truncate">
                    {player.name}
                  </div>
                  {player.isFrozen > 0 && (
                    <span className="text-[10px] text-blue-400 font-semibold">
                      ❄️ Đóng băng {player.isFrozen} lượt
                    </span>
                  )}
                  {player.hasCooldown && (
                    <span className="text-[10px] text-yellow-400 font-semibold">
                      ⏳ Hạ nhiệt 1 lượt
                    </span>
                  )}
                </div>
              </div>

              <div className="font-mono font-black text-sm text-game-neonGold shrink-0 pl-2">
                {player.score} <span className="text-[10px] text-gray-400 font-normal">đ</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
