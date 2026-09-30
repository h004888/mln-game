import React, { useState } from 'react';
import { Lock, ShieldAlert, KeyRound } from 'lucide-react';

interface HostLoginModalProps {
  isOpen: boolean;
  onAuthenticate: (pin: string) => void;
  errorMessage?: string | null;
}

export const HostLoginModal: React.FC<HostLoginModalProps> = ({
  isOpen,
  onAuthenticate,
  errorMessage,
}) => {
  const [pin, setPin] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim()) {
      onAuthenticate(pin.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="glass-panel max-w-md w-full p-8 rounded-3xl border border-gray-700/80 shadow-2xl space-y-6 text-center animate-scaleUp">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center mx-auto text-white shadow-lg">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-white tracking-wide uppercase">
            XÁC THỰC QUYỀN MC
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Vui lòng nhập mã PIN quản trị để mở khóa quyền điều khiển trận đấu
          </p>
        </div>

        {errorMessage && (
          <div className="bg-red-950/80 border border-red-500/80 text-red-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 text-left animate-shake">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <KeyRound className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              maxLength={8}
              autoFocus
              required
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Nhập mã PIN MC (mặc định 8888)..."
              className="w-full pl-12 pr-4 py-4 bg-gray-950/90 border border-gray-700 rounded-2xl text-white font-mono text-center text-lg tracking-widest placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={!pin.trim()}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-black rounded-2xl text-sm tracking-wider uppercase shadow-xl transition-transform active:scale-95 disabled:opacity-50"
          >
            MỞ KHÓA BẢNG ĐIỀU KHIỂN
          </button>
        </form>
      </div>
    </div>
  );
};
