import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { HostActionToolbar } from './HostActionToolbar';
import { GameState } from '../../types/game';

describe('HostActionToolbar', () => {
  it('triggers onOpenBuzzer when clicking Open Buzzer button', () => {
    const onOpen = jest.fn();
    const onReset = jest.fn();
    const onEnd = jest.fn();

    render(
      <HostActionToolbar
        gameState={GameState.LOBBY}
        onOpenBuzzer={onOpen}
        onResetBuzzer={onReset}
        onForceEnd={onEnd}
      />,
    );

    const openBtn = screen.getByText(/MỞ LƯỢT CHUÔNG/i);
    fireEvent.click(openBtn);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('triggers onResetBuzzer when clicking Reset button', () => {
    const onOpen = jest.fn();
    const onReset = jest.fn();
    const onEnd = jest.fn();

    render(
      <HostActionToolbar
        gameState={GameState.BUZZER_OPEN}
        onOpenBuzzer={onOpen}
        onResetBuzzer={onReset}
        onForceEnd={onEnd}
      />,
    );

    const resetBtn = screen.getByText(/RESET CHUÔNG/i);
    fireEvent.click(resetBtn);
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
