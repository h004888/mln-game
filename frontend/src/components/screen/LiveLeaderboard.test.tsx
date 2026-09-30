import React from 'react';
import { render, screen } from '@testing-library/react';
import { LiveLeaderboard } from './LiveLeaderboard';
import { Player, PlayerRole } from '../../types/game';

describe('LiveLeaderboard', () => {
  const mockPlayers: Record<string, Player> = {
    p1: { id: 'p1', name: 'Alice', score: 300, isFrozen: 0, hasCooldown: false, role: PlayerRole.PLAYER, connected: true },
    p2: { id: 'p2', name: 'Bob', score: 150, isFrozen: 0, hasCooldown: false, role: PlayerRole.PLAYER, connected: true },
    p3: { id: 'p3', name: 'Charlie', score: 450, isFrozen: 0, hasCooldown: false, role: PlayerRole.PLAYER, connected: true },
  };

  it('renders players sorted by score descending', () => {
    render(<LiveLeaderboard players={mockPlayers} />);

    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('450')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });
});
