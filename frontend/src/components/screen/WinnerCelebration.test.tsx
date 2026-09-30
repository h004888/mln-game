import React from 'react';
import { render } from '@testing-library/react';
import { WinnerCelebration } from './WinnerCelebration';
import confetti from 'canvas-confetti';

jest.mock('canvas-confetti', () => {
  const fn = jest.fn();
  (fn as any).reset = jest.fn();
  return fn;
});

describe('WinnerCelebration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      return 123;
    });
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should start confetti and cancel animation frame & reset on unmount', () => {
    const { unmount } = render(
      <WinnerCelebration
        winnerName="Test Winner"
        secretKeyword="Vịnh Hạ Long"
        secretImageUrl="https://example.com/img.jpg"
      />,
    );

    expect(window.requestAnimationFrame).toHaveBeenCalled();
    unmount();

    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(123);
    expect(confetti.reset).toHaveBeenCalled();
  });
});
