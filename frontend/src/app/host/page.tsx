'use client';

import React, { useEffect, useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { GameState, PlayerRole } from '../../types/game';
import { HostActionToolbar } from '../../components/host/HostActionToolbar';
import { UltimateGuessReviewModal } from '../../components/host/UltimateGuessReviewModal';
import { PlayerListManagement } from '../../components/host/PlayerListManagement';
import { HostLoginModal } from '../../components/host/HostLoginModal';
import { GameStudioModal } from '../../components/host/GameStudioModal';
import { soundEffects } from '../../utils/soundEffects';
import { Sliders, RotateCcw, Sparkles, AlertCircle } from 'lucide-react';

export default function HostPage() {
  const [isStudioOpen, setIsStudioOpen] = useState(false);

  const {
    room,
    isHostAuthenticated,
    hostAuthError,
    alertMessage,
    authenticateHost,
    hostOpenBuzzer,
    hostResetBuzzer,
    hostReviewUltimateGuess,
    hostForceEnd,
    hostResetGame,
    createCustomGame,
  } = useSocket(PlayerRole.HOST, 'MC Điều Khiển');

  // Trigger sound effects based on game events
  useEffect(() => {
    if (room?.status === GameState.BUZZER_OPEN) {
      soundEffects.playBuzzerClaim();
    } else if (room?.status === GameState.GAME_OVER) {
      soundEffects.playVictory();
    }
  }, [room?.status]);

  const activePlayer = room?.activePlayerId ? room.players[room.activePlayerId] : null;
  const currentCard = room?.cards.find((c) => c.id === room?.currentCardId);

  return (
    <main className="min-h-screen p-6 flex flex-col justify-between max-w-6xl mx-auto select-none space-y-6">
      {/* Alert toast if unauthorized */}
      {alertMessage && (
        <div className="bg-red-950 border border-red-500 text-red-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{alertMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="glass-panel p-4 rounded-3xl flex items-center justify-between border border-gray-700/80 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-lg">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase">
              BẢNG ĐIỀU KHIỂN MC CHỦ TRÒ
            </h1>
            <p className="text-xs text-gray-400 font-medium">
              Kiểm soát nhịp độ trận đấu, mở chuông và duyệt đáp án ảnh bí ẩn
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsStudioOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Game Studio</span>
          </button>

          <button
            onClick={() => hostResetGame()}
            className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl border border-gray-700 text-xs flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Tạo trận mới</span>
          </button>
        </div>
      </header>

      {/* Main Action Bar */}
      <HostActionToolbar
        gameState={room?.status || GameState.LOBBY}
        onOpenBuzzer={() => hostOpenBuzzer()}
        onResetBuzzer={() => hostResetBuzzer()}
        onForceEnd={() => hostForceEnd()}
      />

      {/* Real-time Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-panel p-5 rounded-3xl border border-gray-700/80 space-y-2">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            TRẠNG THÁI HIỆN TẠI
          </span>
          <div className="text-lg font-black text-game-neonCyan">
            {room?.status || 'LOBBY'}
          </div>
          <p className="text-xs text-gray-400">
            Tổng số vòng đấu đã diễn ra: <strong className="text-white">{room?.totalRounds || 0}</strong>
          </p>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-gray-700/80 space-y-2">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            NGƯỜI GIÀNH QUYỀN CHUÔNG
          </span>
          <div className="text-lg font-black text-game-neonGold truncate">
            {activePlayer ? activePlayer.name : 'Chưa có ai'}
          </div>
          <p className="text-xs text-gray-400">
            {currentCard ? `Đang thao tác ô số ${currentCard.index}` : 'Đang chờ chọn ô / bấm chuông'}
          </p>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-gray-700/80 space-y-2">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            TỪ KHÓA ẢNH BÍ ẨN
          </span>
          <div className="text-lg font-black text-game-neonPink truncate">
            {room?.secretImageKeyword || 'Vịnh Hạ Long'}
          </div>
          <p className="text-xs text-gray-400">
            Đã mở {room?.cards.filter((c) => c.isOpened).length || 0}/16 ô thẻ
          </p>
        </div>
      </div>

      {/* Players List */}
      <PlayerListManagement players={room?.players || {}} />

      {/* Modal review Ultimate Guess */}
      <UltimateGuessReviewModal
        pendingGuess={room?.pendingUltimateGuess || null}
        secretKeyword={room?.secretImageKeyword || ''}
        onReview={(isApproved) => hostReviewUltimateGuess(isApproved)}
      />

      {/* Modal Login Host PIN */}
      <HostLoginModal
        isOpen={!isHostAuthenticated}
        onAuthenticate={(pin) => authenticateHost(pin)}
        errorMessage={hostAuthError}
      />

      {/* Modal Game Studio */}
      <GameStudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        onApplyCustomGame={(config) => createCustomGame(config)}
        initialConfig={
          room?.cards && room.cards.length === 16
            ? {
                secretMedia: {
                  keyword: room.secretImageKeyword,
                  imageUrl: room.secretImageUrl,
                },
                questions: room.cards.map((c) => c.question),
              }
            : undefined
        }
      />
    </main>
  );
}

