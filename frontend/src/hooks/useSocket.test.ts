import { renderHook, act } from '@testing-library/react';
import { useSocket } from './useSocket';
import { PlayerRole } from '../types/game';

// Mock socket.io-client
const mockSocket = {
  on: jest.fn(),
  emit: jest.fn(),
  connect: jest.fn(),
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

  it('should set isRestoringSession to true initially when sessionId exists in localStorage', () => {
    localStorage.setItem('mln_player_session', 'session_abc_123');

    const { result } = renderHook(() => useSocket(PlayerRole.PLAYER, ''));
    expect(result.current.isRestoringSession).toBe(true);

    const reconnectedCallback = mockSocket.on.mock.calls.find((call) => call[0] === 'player:reconnected')?.[1];
    expect(reconnectedCallback).toBeDefined();

    act(() => {
      reconnectedCallback({
        id: 'socket-test-1',
        sessionId: 'session_abc_123',
        name: 'Player Reconnected',
        score: 100,
        isFrozen: 0,
        hasCooldown: false,
        role: PlayerRole.PLAYER,
        connected: true,
      });
    });

    expect(result.current.isRestoringSession).toBe(false);
    expect(result.current.me?.name).toBe('Player Reconnected');
  });

  it('should set isRestoringSession to false if no sessionId exists in localStorage', () => {
    const { result } = renderHook(() => useSocket(PlayerRole.PLAYER, ''));
    expect(result.current.isRestoringSession).toBe(false);
  });

  it('should set isRestoringSession to false on session:invalid', () => {
    localStorage.setItem('mln_player_session', 'session_invalid');
    const { result } = renderHook(() => useSocket(PlayerRole.PLAYER, ''));
    expect(result.current.isRestoringSession).toBe(true);

    const invalidCallback = mockSocket.on.mock.calls.find((call) => call[0] === 'session:invalid')?.[1];
    expect(invalidCallback).toBeDefined();

    act(() => {
      invalidCallback({ message: 'Session expired' });
    });

    expect(result.current.isRestoringSession).toBe(false);
    expect(localStorage.getItem('mln_player_session')).toBeNull();
    expect(result.current.me).toBeNull();
  });

  it('should auto-reconnect if sessionId exists in localStorage', () => {
    localStorage.setItem('mln_player_session', 'session_abc_123');

    renderHook(() => useSocket(PlayerRole.PLAYER, ''));

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
    expect(result.current.isRestoringSession).toBe(false);
  });

  it('should support leaveGame by clearing storage, resetting me, and reconnecting', () => {
    localStorage.setItem('mln_player_session', 'session_test_abc');
    const { result } = renderHook(() => useSocket(PlayerRole.PLAYER, ''));

    act(() => {
      result.current.leaveGame();
    });

    expect(localStorage.getItem('mln_player_session')).toBeNull();
    expect(result.current.me).toBeNull();
    expect(result.current.isRestoringSession).toBe(false);
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});
