import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnswerButtons } from './AnswerButtons';

describe('AnswerButtons', () => {
  const mockOptions = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Huế'];

  it('renders all 4 options with letters A, B, C, D', () => {
    const onSelect = jest.fn();
    render(<AnswerButtons options={mockOptions} onSelectAnswer={onSelect} disabled={false} />);

    expect(screen.getByText('Hà Nội')).toBeInTheDocument();
    expect(screen.getByText('TP. Hồ Chí Minh')).toBeInTheDocument();
    expect(screen.getByText('Đà Nẵng')).toBeInTheDocument();
    expect(screen.getByText('Huế')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Hà Nội'));
    expect(onSelect).toHaveBeenCalledWith(0);
  });

  it('disables buttons when disabled prop is true', () => {
    const onSelect = jest.fn();
    render(<AnswerButtons options={mockOptions} onSelectAnswer={onSelect} disabled={true} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });
});
