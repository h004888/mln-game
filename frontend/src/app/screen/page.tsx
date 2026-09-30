'use client';

import React from 'react';
import { useSocket } from '../../hooks/useSocket';
import { GameState, PlayerRole } from '../../types/game';
import { BoardGrid } from '../../components/screen/BoardGrid';
import { QuestionOverlay } from '../../components/screen/QuestionOverlay';
import { LiveLeaderboard } from '../../components/screen/LiveLeaderboard';
import { BigTimerBar } from '../../components/screen/BigTimerBar';
import { WinnerCelebration } from '../../components/screen/WinnerCelebration';
import { Tv, Bell, Users, Flame } from 'lucide-react';

export default function ProjectorScreenPage() {
  const { room, timerRemaining, timerType } = useSocket(PlayerRole.SCREEN, 'Máy Chiếu Khán Phòng');

  const currentCard = room?.cards.find((c) => c.id === room?.currentCardId);
  const activePlayer = room?.activePlayerId ? room.players[room.activePlayerId] : null;
  const isQuestionActive = room?.status === GameState.QUESTION_ACTIVE && currentCard;
  const isGameOver = room?.status === GameState.GAME_OVER;
  const totalPlayers = Object.values(room?.players || {}).filter((p) => p.role === PlayerRole.PLAYER).length;

  return (
    <main className="min-h-screen p-6 flex flex-col justify-between max-w-7xl mx-auto select-none bg-radial-gradient">
      {/* Top Banner */}
      <header className="glass-panel p-4 rounded-3xl flex items-center justify-between border border-gray-700/80 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-game-neonCyan to-cyan-200 bg-clip-text text-transparent uppercase tracking-wider">
              BẢNG ĐẤU TRÍ TRUY TÌM ẢNH ẨN
            </h1>
            <p className="text-xs text-gray-400 font-medium">
              30 Người chơi trực tiếp • Bấm chuông & lật mở mảnh ghép
            </p>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-900/80 px-4 py-2 rounded-2xl border border-gray-700">
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-gray-300">
              Đang online: <strong className="text-white text-sm font-mono">{totalPlayers}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 bg-gray-900/80 px-4 py-2 rounded-2xl border border-game-neonGold/40">
            <span className="text-xs font-bold text-game-neonGold uppercase">
              Vòng: <strong className="text-white text-sm font-mono">{room?.totalRounds || 1}</strong>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area: 2 Columns (65% Grid / Question vs 35% Leaderboard & Status) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 flex-1 items-center">
        {/* Left Column (7/12): Board Grid OR Question Overlay */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center space-y-4">
          {isQuestionActive ? (
            <div className="w-full max-w-xl">
              <QuestionOverlay
                card={currentCard}
                activePlayerName={activePlayer?.name}
                isStealMode={room?.status === GameState.STEAL_OPEN}
              />
            </div>
          ) : (
            <BoardGrid
              cards={room?.cards || []}
              secretImageUrl={room?.secretImageUrl || 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80'}
              activeCardIndex={currentCard?.index}
            />
          )}
        </div>

        {/* Right Column (5/12): Live Status & Leaderboard */}
        <div className="lg:col-span-5 space-y-5">
          {/* Status Message Box */}
          <div className="glass-panel p-5 rounded-3xl border border-gray-700/80 space-y-3">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              TRẠNG THÁI HIỆN TẠI
            </span>

            {room?.status === GameState.LOBBY && (
              <div className="flex items-center gap-3 text-cyan-300 font-bold text-sm sm:text-base">
                <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
                Đang chờ MC phát động trận đấu...
              </div>
            )}

            {room?.status === GameState.BUZZER_OPEN && (
              <div className="flex items-center gap-3 text-game-neonRed font-black text-base sm:text-lg animate-pulse">
                <Bell className="w-6 h-6 animate-bounce" />
                CHUÔNG ĐANG MỞ — HÃY BẤM NHANH!
              </div>
            )}

            {room?.status === GameState.CARD_SELECTION && (
              <div className="flex items-center gap-2 text-yellow-300 font-bold text-sm sm:text-base">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
                <span>{activePlayer?.name || 'Người chơi'}</span> đang chọn ô thẻ!
              </div>
            )}

            {room?.status === GameState.QUESTION_ACTIVE && (
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm sm:text-base">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>{activePlayer?.name || 'Người chơi'}</span> đang trả lời câu hỏi!
              </div>
            )}

            {room?.status === GameState.STEAL_OPEN && (
              <div className="flex items-center gap-2 text-amber-400 font-black text-base sm:text-lg animate-bounce">
                <Flame className="w-6 h-6 text-amber-400" />
                MỞ CHUÔNG CƯỚP LƯỢT (+150đ)!
              </div>
            )}

            {room?.status === GameState.INTERMISSION && (
              <div className="flex items-center gap-2 text-gray-300 font-medium text-sm">
                Nghỉ giữa hiệp — Chuẩn bị lượt tiếp theo...
              </div>
            )}
          </div>

          {/* Big Timer Bar */}
          {timerRemaining !== null && timerRemaining > 0 && (
            <BigTimerBar
              remainingSeconds={timerRemaining}
              totalDuration={timerType === 'SELECT_CARD' ? 5 : 15}
              label={timerType === 'SELECT_CARD' ? 'Thời gian chọn ô' : 'Thời gian trả lời câu hỏi'}
            />
          )}

          {/* Top 5 Leaderboard */}
          <LiveLeaderboard players={room?.players || {}} />
        </div>
      </div>

      {/* Instant Win MVP Celebration Overlay */}
      {isGameOver && (
        <WinnerCelebration
          winnerName={room?.winnerName || 'NHÀ VÔ ĐỊCH'}
          secretKeyword={room?.secretImageKeyword || 'BỨC ẢNH BÍ ẨN'}
          secretImageUrl={room?.secretImageUrl || ''}
        />
      )}
    </main>
  );
}
