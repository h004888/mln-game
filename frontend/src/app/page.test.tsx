import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PlayerPage from './page';

let mockMe: any = null;
const mockJoinGame = jest.fn((name: string) => {
  mockMe = { id: 's1', name, score: 0, isFrozen: 0, hasCooldown: false, role: 'PLAYER', connected: true };
});

const mockLeaveGame = jest.fn(() => {
  mockMe = null;
});

// Mock useSocket hook
jest.mock('../hooks/useSocket', () => ({
  useSocket: () => ({
    room: {
      roomId: 'DEFAULT_ROOM',
      status: 'LOBBY',
      players: {},
      cards: [],
      activePlayerId: null,
      currentCardId: null,
      secretImageKeyword: 'Vịnh Hạ Long',
      secretImageUrl: '/test.jpg',
      winnerId: null,
      winnerName: null,
      pendingUltimateGuess: null,
      timer: { duration: 0, remaining: 0, type: null },
      totalRounds: 0,
    },
    me: mockMe,
    timerRemaining: null,
    alertMessage: null,
    joinGame: mockJoinGame,
    leaveGame: mockLeaveGame,
    buzz: jest.fn(),
    stealBuzz: jest.fn(),
    selectCard: jest.fn(),
    submitAnswer: jest.fn(),
    submitUltimateGuess: jest.fn(),
  }),
}));

describe('PlayerPage', () => {
  beforeEach(() => {
    mockMe = null;
    localStorage.clear();
  });

  it('renders the login screen and allows joining', () => {
    const { rerender } = render(<PlayerPage />);
    expect(screen.getByText('BUZZER ARENA')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Nhập họ tên/i)).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/Nhập họ tên/i);
    const button = screen.getByRole('button', { name: /Vào Trận Đấu/i });

    fireEvent.change(input, { target: { value: 'Nguyen Van A' } });
    expect(button).not.toBeDisabled();
    fireEvent.click(button);

    expect(mockJoinGame).toHaveBeenCalledWith('Nguyen Van A');
    expect(localStorage.getItem('mln_saved_name')).toBe('Nguyen Van A');

    // Rerender after mockMe is set by join
    rerender(<PlayerPage />);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText(/Đoán từ khóa ảnh gốc/i)).toBeInTheDocument();
  });

  it('allows leaving game back to login screen', () => {
    mockMe = { id: 's1', name: 'Nguyen Van A', score: 0, isFrozen: 0, hasCooldown: false, role: 'PLAYER', connected: true };
    const { rerender } = render(<PlayerPage />);
    expect(screen.getByText('Nguyen Van A')).toBeInTheDocument();

    const leaveBtn = screen.getByTitle(/Đổi tên \/ Rời phòng/i);
    fireEvent.click(leaveBtn);

    expect(mockLeaveGame).toHaveBeenCalled();
    rerender(<PlayerPage />);
    expect(screen.getByText('BUZZER ARENA')).toBeInTheDocument();
  });
});

