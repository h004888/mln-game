'use client';

import React from 'react';
import { GameState } from '../../types/game';
import { Bell, Flame, Lock, Snowflake, Volume2 } from 'lucide-react';

interface BuzzerButtonProps {
  gameState: GameState;
  isFrozen: number;
  hasCooldown: boolean;
  onBuzz: () => void;
  isStealMode?: boolean;
}

export const BuzzerButton: React.FC<BuzzerButtonProps> = ({
  gameState,
  isFrozen,
  hasCooldown,
  onBuzz,
  isStealMode = false,
}) => {
  const isBuzzerOpen = gameState === GameState.BUZZER_OPEN || (isStealMode && gameState === GameState.STEAL_OPEN);
  const isDisabled = !isBuzzerOpen || isFrozen > 0 || hasCooldown;

  let buttonText = 'CHỜ LƯỢT TIẾP THEO';
  let subText = 'MC chưa mở chuông';
  let colorStyle = 'bg-gray-800 text-gray-400 border-gray-700 opacity-60';

  if (isFrozen > 0) {
    buttonText = `BỊ ĐÓNG BĂNG (${isFrozen} lượt)`;
    subText = 'Do đoán sai ảnh bí ẩn';
    colorStyle = 'bg-blue-950 text-blue-300 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]';
  } else if (hasCooldown) {
    buttonText = 'ĐANG HẠ NHIỆT (1 lượt)';
    subText = 'Nhường cơ hội cho người khác';
    colorStyle = 'bg-yellow-950 text-yellow-300 border-yellow-600';
  } else if (isBuzzerOpen) {
    if (isStealMode) {
      buttonText = 'CƯỚP LƯỢT NGAY!';
      subText = '+150 điểm nếu đúng';
      colorStyle = 'bg-gradient-to-tr from-amber-600 via-orange-500 to-yellow-400 text-black border-amber-300 animate-pulse-glow';
    } else {
      buttonText = 'BẤM CHUÔNG!';
      subText = 'Chạm ngay để giành quyền chọn ô';
      colorStyle = 'bg-gradient-to-tr from-game-neonRed via-pink-600 to-rose-400 text-white border-rose-300 shadow-[0_0_35px_rgba(255,51,102,0.9)] animate-pulse-glow';
    }
  }

  const handleClick = () => {
    if (!isDisabled) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([80, 50, 80]);
      }
      onBuzz();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full">
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={`w-64 h-64 sm:w-72 sm:h-72 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-150 transform active:scale-90 select-none shadow-2xl relative overflow-hidden ${colorStyle}`}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <div className="absolute inset-0 bg-white opacity-0 active:opacity-20 transition-opacity" />

        {isFrozen > 0 ? (
          <Snowflake className="w-16 h-16 mb-2 animate-spin text-blue-300" style={{ animationDuration: '8s' }} />
        ) : hasCooldown ? (
          <Lock className="w-16 h-16 mb-2 text-yellow-300" />
        ) : isBuzzerOpen ? (
          isStealMode ? (
            <Flame className="w-20 h-20 mb-2 text-black animate-bounce" />
          ) : (
            <Bell className="w-20 h-20 mb-2 text-white animate-bounce" />
          )
        ) : (
          <Lock className="w-14 h-14 mb-2 text-gray-500" />
        )}

        <span className="text-xl sm:text-2xl font-black tracking-wider text-center px-4 uppercase">
          {buttonText}
        </span>
        <span className="text-xs sm:text-sm font-medium mt-1 opacity-90 px-4 text-center">
          {subText}
        </span>
      </button>
    </div>
  );
};
