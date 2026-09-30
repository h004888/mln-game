import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BuzzerButton } from './BuzzerButton';
import { GameState } from '../../types/game';

describe('BuzzerButton', () => {
  it('renders active buzzer when BUZZER_OPEN and player can buzz', () => {
    const handleBuzz = jest.fn();
    render(
      <BuzzerButton
        gameState={GameState.BUZZER_OPEN}
        isFrozen={0}
        hasCooldown={false}
        onBuzz={handleBuzz}
      />,
    );

    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
    expect(screen.getByText('BẤM CHUÔNG!')).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleBuzz).toHaveBeenCalledTimes(1);
  });

  it('renders disabled buzzer when player is frozen', () => {
    const handleBuzz = jest.fn();
    render(
      <BuzzerButton
        gameState={GameState.BUZZER_OPEN}
        isFrozen={2}
        hasCooldown={false}
        onBuzz={handleBuzz}
      />,
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText(/BỊ ĐÓNG BĂNG/i)).toBeInTheDocument();
  });

  it('renders cooldown state when player has cooldown', () => {
    const handleBuzz = jest.fn();
    render(
      <BuzzerButton
        gameState={GameState.BUZZER_OPEN}
        isFrozen={0}
        hasCooldown={true}
        onBuzz={handleBuzz}
      />,
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText(/ĐANG HẠ NHIỆT/i)).toBeInTheDocument();
  });
});
