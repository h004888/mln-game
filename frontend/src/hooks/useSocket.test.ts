import { renderHook, act } from '@testing-library/react';
import { useSocket } from './useSocket';
import { PlayerRole } from '../types/game';

// Mock socket.io-client
const mockSocket = {
  on: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
  id: 'socket-test-1',
};

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}));

describe('useSocket hook - Reconnection & Host Auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should auto-reconnect if sessionId exists in localStorage', () => {
    localStorage.setItem('mln_player_session', 'session_abc_123');

    renderHook(() => useSocket(PlayerRole.PLAYER, ''));

    // Find the 'connect' callback
    const connectCallback = mockSocket.on.mock.calls.find((call) => call[0] === 'connect')?.[1];
    expect(connectCallback).toBeDefined();

    act(() => {
      connectCallback();
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('player:reconnect', { sessionId: 'session_abc_123' });
  });

  it('should save sessionId to localStorage when player:joined is received', () => {
    const { result } = renderHook(() => useSocket(PlayerRole.PLAYER, ''));

    const joinedCallback = mockSocket.on.mock.calls.find((call) => call[0] === 'player:joined')?.[1];
    expect(joinedCallback).toBeDefined();

    act(() => {
      joinedCallback({
        id: 'socket-test-1',
        sessionId: 'session_xyz_789',
        name: 'Player X',
        score: 0,
        isFrozen: 0,
        hasCooldown: false,
        role: PlayerRole.PLAYER,
        connected: true,
      });
    });

    expect(localStorage.getItem('mln_player_session')).toBe('session_xyz_789');
    expect(result.current.me?.name).toBe('Player X');
  });

  it('should remove sessionId from localStorage on session:invalid', () => {
    localStorage.setItem('mln_player_session', 'session_invalid');
    const { result } = renderHook(() => useSocket(PlayerRole.PLAYER, ''));

    const invalidCallback = mockSocket.on.mock.calls.find((call) => call[0] === 'session:invalid')?.[1];
    expect(invalidCallback).toBeDefined();

    act(() => {
      invalidCallback({ message: 'Session expired' });
    });

    expect(localStorage.getItem('mln_player_session')).toBeNull();
    expect(result.current.me).toBeNull();
  });
});
