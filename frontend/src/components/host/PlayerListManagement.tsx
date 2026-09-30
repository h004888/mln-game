'use client';

import React from 'react';
import { Player, PlayerRole } from '../../types/game';
import { Users, Snowflake, Lock, Volume2 } from 'lucide-react';

interface PlayerListManagementProps {
  players: Record<string, Player>;
}

export const PlayerListManagement: React.FC<PlayerListManagementProps> = ({ players }) => {
  const playerList = Object.values(players).filter((p) => p.role === PlayerRole.PLAYER);

  return (
    <div className="glass-panel p-5 rounded-3xl border border-gray-700/80 shadow-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-gray-700/60 pb-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            Danh sách Người Chơi ({playerList.length}/30)
          </h3>
        </div>
      </div>

      {playerList.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-6 italic">
          Chưa có người chơi nào tham gia phòng...
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
          {playerList.map((player) => (
            <div
              key={player.id}
              className="p-3 bg-gray-900/70 rounded-2xl border border-gray-800 flex items-center justify-between"
            >
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      player.connected ? 'bg-emerald-400' : 'bg-gray-600'
                    }`}
                  />
                  <span className="truncate">{player.name}</span>
                </div>
                <div className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                  <span className="text-game-neonGold font-mono font-bold">{player.score}đ</span>
                  {player.isFrozen > 0 && (
                    <span className="text-blue-400 flex items-center gap-0.5">
                      <Snowflake className="w-3 h-3" /> {player.isFrozen}L
                    </span>
                  )}
                  {player.hasCooldown && (
                    <span className="text-yellow-400 flex items-center gap-0.5">
                      <Lock className="w-3 h-3" /> Cooldown
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
