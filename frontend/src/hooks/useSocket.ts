'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameRoom, GameState, Player, PlayerRole } from '../types/game';

export function getBackendUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    const { hostname, protocol } = window.location;
    const configuredUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (configuredUrl && !configuredUrl.includes('localhost')) {
      return configuredUrl;
    }
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${protocol}//${hostname}:3001`;
    }
  }
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
}

export function useSocket(role: PlayerRole = PlayerRole.PLAYER, initialName = '') {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [me, setMe] = useState<Player | null>(null);
  const [isHostAuthenticated, setIsHostAuthenticated] = useState(false);
  const [hostAuthError, setHostAuthError] = useState<string | null>(null);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const [timerType, setTimerType] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    const backendUrl = getBackendUrl();
    const socket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      if (role === PlayerRole.PLAYER) {
        const savedSession = typeof window !== 'undefined' ? localStorage.getItem('mln_player_session') : null;
        if (savedSession) {
          socket.emit('player:reconnect', { sessionId: savedSession });
        } else if (initialName) {
          socket.emit('player:join', { role, name: initialName });
        }
      } else {
        socket.emit('player:join', { role, name: initialName });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('room:state', (updatedRoom: GameRoom) => {
      setRoom(updatedRoom);
      if (socket.id && updatedRoom.players[socket.id]) {
        setMe(updatedRoom.players[socket.id]);
      }
    });

    socket.on('room:updated', (updatedRoom: GameRoom) => {
      setRoom(updatedRoom);
      if (socket.id && updatedRoom.players[socket.id]) {
        setMe(updatedRoom.players[socket.id]);
      }
    });

    socket.on('player:joined', (player: Player) => {
      setMe(player);
      if (player.sessionId && typeof window !== 'undefined') {
        localStorage.setItem('mln_player_session', player.sessionId);
      }
    });

    socket.on('player:reconnected', (player: Player) => {
      setMe(player);
      if (player.sessionId && typeof window !== 'undefined') {
        localStorage.setItem('mln_player_session', player.sessionId);
      }
    });

    socket.on('session:invalid', (data: { message?: string }) => {
      setMe(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mln_player_session');
      }
      if (data?.message) {
        setAlertMessage(data.message);
        setTimeout(() => setAlertMessage(null), 3000);
      }
    });

    socket.on('host:auth_result', (data: { success: boolean; message?: string }) => {
      if (data.success) {
        setIsHostAuthenticated(true);
        setHostAuthError(null);
      } else {
        setIsHostAuthenticated(false);
        setHostAuthError(data.message || 'Mã PIN Host không chính xác');
      }
    });

    socket.on('error', (data: { message: string }) => {
      setAlertMessage(`⚠️ ${data.message}`);
      setTimeout(() => setAlertMessage(null), 4000);
    });

    socket.on('timer:tick', (data: { type: string; remaining: number }) => {
      setTimerRemaining(data.remaining);
      setTimerType(data.type);
    });

    socket.on('timer:expired', (data: { reason: string }) => {
      setTimerRemaining(0);
      setAlertMessage(`⏰ Hết giờ: ${data.reason}`);
      setTimeout(() => setAlertMessage(null), 3000);
    });

    socket.on('buzzer:rejected', (data: { reason: string }) => {
      setAlertMessage(`❌ Chuông bị từ chối: ${data.reason}`);
      setTimeout(() => setAlertMessage(null), 3000);
    });

    return () => {
      socket.disconnect();
    };
  }, [role, initialName]);

  const joinGame = (name: string) => {
    if (socketRef.current) {
      socketRef.current.emit('player:join', { role, name });
    }
  };

  const authenticateHost = (pin: string) => {
    if (socketRef.current) {
      socketRef.current.emit('host:authenticate', { pin });
    }
  };

  const buzz = () => {
    if (socketRef.current) {
      socketRef.current.emit('player:buzz');
    }
  };

  const stealBuzz = () => {
    if (socketRef.current) {
      socketRef.current.emit('player:steal_buzz');
    }
  };

  const selectCard = (cardIndex: number) => {
    if (socketRef.current) {
      socketRef.current.emit('player:select_card', { cardIndex });
    }
  };

  const submitAnswer = (selectedIndex: number) => {
    if (socketRef.current) {
      socketRef.current.emit('player:submit_answer', { selectedIndex });
    }
  };

  const submitUltimateGuess = (keyword: string) => {
    if (socketRef.current) {
      socketRef.current.emit('player:ultimate_guess', { keyword });
    }
  };

  const hostOpenBuzzer = () => {
    if (socketRef.current) socketRef.current.emit('host:open_buzzer');
  };

  const hostResetBuzzer = () => {
    if (socketRef.current) socketRef.current.emit('host:reset_buzzer');
  };

  const hostReviewUltimateGuess = (isApproved: boolean) => {
    if (socketRef.current) socketRef.current.emit('host:review_ultimate_guess', { isApproved });
  };

  const hostForceEnd = () => {
    if (socketRef.current) socketRef.current.emit('host:force_end');
  };

  const hostResetGame = () => {
    if (socketRef.current) socketRef.current.emit('host:reset_game');
  };

  const leaveGame = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mln_player_session');
    }
    setMe(null);
    if (socketRef.current) {
      if (typeof socketRef.current.disconnect === 'function') {
        socketRef.current.disconnect();
      }
      if (typeof socketRef.current.connect === 'function') {
        socketRef.current.connect();
      }
    }
  };

  const createCustomGame = (config: any) => {
    if (socketRef.current) socketRef.current.emit('host:create_custom_game', config);
  };

  return {
    socket: socketRef.current,
    isConnected,
    room,
    me,
    isHostAuthenticated,
    hostAuthError,
    timerRemaining,
    timerType,
    alertMessage,
    joinGame,
    leaveGame,
    authenticateHost,
    buzz,
    stealBuzz,
    selectCard,
    submitAnswer,
    submitUltimateGuess,
    hostOpenBuzzer,
    hostResetBuzzer,
    hostReviewUltimateGuess,
    hostForceEnd,
    hostResetGame,
    createCustomGame,
  };
}
