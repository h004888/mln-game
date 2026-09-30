'use client';

import React, { useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { GameState, PlayerRole } from '../types/game';
import { BuzzerButton } from '../components/player/BuzzerButton';
import { CardPickerModal } from '../components/player/CardPickerModal';
import { AnswerButtons } from '../components/player/AnswerButtons';
import { UltimateGuessModal } from '../components/player/UltimateGuessModal';
import { Flame, Trophy, User, Zap, AlertCircle } from 'lucide-react';

export default function PlayerPage() {
  const [playerName, setPlayerName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [isUltimateModalOpen, setIsUltimateModalOpen] = useState(false);

  const {
    room,
    me,
    timerRemaining,
    alertMessage,
    joinGame,
    buzz,
    stealBuzz,
    selectCard,
    submitAnswer,
    submitUltimateGuess,
  } = useSocket(PlayerRole.PLAYER, '');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      joinGame(playerName.trim());
      setHasJoined(true);
    }
  };

  const isRegistered = hasJoined || !!me;

  // Screen 1: Name Input Screen
  if (!isRegistered) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#0a0d14] via-[#101726] to-[#0a0d14]">
        <div className="glass-panel p-8 rounded-3xl max-w-sm w-full space-y-6 text-center shadow-2xl border border-gray-800">
          <div className="w-16 h-16 bg-gradient-to-tr from-game-neonPink to-game-neonCyan rounded-2xl mx-auto flex items-center justify-center shadow-lg transform -rotate-6">
            <Zap className="w-9 h-9 text-white" />
          </div>

          <div>
            <h1 className="text-2xl font-black text-white tracking-wide">
              BUZZER ARENA
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Nhập tên của bạn để tham gia sàn đấu 30 người
            </p>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <input
              type="text"
              required
              maxLength={20}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Nhập họ tên / Biệt danh..."
              className="w-full px-4 py-3.5 bg-gray-950/80 border border-gray-700 rounded-xl text-white font-bold text-center placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-game-neonCyan"
            />

            <button
              type="submit"
              disabled={!playerName.trim()}
              className="w-full py-4 bg-gradient-to-r from-game-neonCyan to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black rounded-xl text-base tracking-wider uppercase shadow-lg transition-transform transform active:scale-95 disabled:opacity-50"
            >
              Vào Trận Đấu
            </button>
          </form>
        </div>
      </main>
    );
  }

  const currentCard = room?.cards.find((c) => c.id === room.currentCardId);
  const isMyTurn = room?.activePlayerId === me?.id;
  const isCardSelection = isMyTurn && room?.status === GameState.CARD_SELECTION;
  const isAnswering = isMyTurn && room?.status === GameState.QUESTION_ACTIVE;
  const isStealOpen = room?.status === GameState.STEAL_OPEN;

  return (
    <main className="min-h-screen flex flex-col justify-between p-4 max-w-lg mx-auto select-none">
      {/* Top Header: Player Info & Score */}
      <header className="glass-panel p-3.5 rounded-2xl flex items-center justify-between border border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center font-bold text-white shadow">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-black text-white leading-none">{me?.name || playerName}</div>
            <div className="text-[10px] text-gray-400 font-medium mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
              Đã kết nối phòng
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-gray-900/90 px-3.5 py-1.5 rounded-xl border border-game-neonGold/40 shadow-inner">
          <Trophy className="w-4 h-4 text-game-neonGold" />
          <span className="text-base font-black text-game-neonGold font-mono">
            {me?.score ?? 0}
          </span>
          <span className="text-[10px] text-gray-400">điểm</span>
        </div>
      </header>

      {/* Alert toast */}
      {alertMessage && (
        <div className="bg-red-950 border border-red-500 text-red-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 my-2 animate-bounce">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{alertMessage}</span>
        </div>
      )}

      {/* Main Interactive Stage */}
      <section className="flex-1 flex flex-col items-center justify-center my-4">
        {/* Status 1: Answering Question */}
        {isAnswering && currentCard ? (
          <div className="glass-panel border-game-neonCyan border-2 rounded-3xl p-5 w-full space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="bg-game-neonCyan/20 text-game-neonCyan px-3 py-1 rounded-full text-xs font-black uppercase">
                Ô số {currentCard.index}
              </span>
              {timerRemaining !== null && (
                <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold font-mono animate-pulse">
                  ⏱️ {timerRemaining}s
                </span>
              )}
            </div>

            <h2 className="text-base sm:text-lg font-bold text-white leading-snug">
              {currentCard.question.text}
            </h2>

            <AnswerButtons
              options={currentCard.question.options}
              onSelectAnswer={(index) => submitAnswer(index)}
            />
          </div>
        ) : (
          /* Status 2: Buzzer Button */
          <div className="w-full flex flex-col items-center">
            <BuzzerButton
              gameState={room?.status || GameState.LOBBY}
              isFrozen={me?.isFrozen ?? 0}
              hasCooldown={me?.hasCooldown ?? false}
              isStealMode={isStealOpen}
              onBuzz={isStealOpen ? stealBuzz : buzz}
            />
          </div>
        )}
      </section>

      {/* Footer Actions */}
      <footer className="space-y-2">
        <button
          onClick={() => setIsUltimateModalOpen(true)}
          disabled={room?.status === GameState.GAME_OVER || (me?.isFrozen ?? 0) > 0}
          className="w-full py-3.5 bg-gradient-to-r from-amber-600/90 to-yellow-500/90 hover:from-amber-500 hover:to-yellow-400 text-black font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-40"
        >
          <Flame className="w-5 h-5" />
          <span className="text-xs sm:text-sm uppercase tracking-wider">
            🔥 ĐOÁN TỪ KHÓA ẢNH GỐC (THẮNG NGAY)
          </span>
        </button>
      </footer>

      {/* Modal: Card Picker when buzzing successfully */}
      {isCardSelection && (
        <CardPickerModal
          cards={room?.cards || []}
          onSelectCard={(idx) => selectCard(idx)}
          remainingSeconds={timerRemaining}
        />
      )}

      {/* Modal: Ultimate Guess */}
      <UltimateGuessModal
        isOpen={isUltimateModalOpen}
        onClose={() => setIsUltimateModalOpen(false)}
        onSubmitGuess={(kw) => submitUltimateGuess(kw)}
      />
    </main>
  );
}
