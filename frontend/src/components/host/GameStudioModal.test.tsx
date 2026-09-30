import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameStudioModal } from './GameStudioModal';

describe('GameStudioModal', () => {
  const mockInitialConfig = {
    secretMedia: {
      keyword: 'Chùa Một Cột',
      imageUrl: 'https://example.com/chua-mot-cot.jpg',
      hint: 'Kiến trúc hoa sen',
    },
    questions: Array.from({ length: 16 }, (_, i) => ({
      id: `q-${i + 1}`,
      text: `Câu hỏi mẫu số ${i + 1}`,
      options: ['A', 'B', 'C', 'D'],
      correctIndex: 0,
    })),
  };

  it('renders Game Studio with secret media inputs and 16 question tabs', () => {
    render(
      <GameStudioModal
        isOpen={true}
        onClose={jest.fn()}
        onApplyCustomGame={jest.fn()}
        initialConfig={mockInitialConfig}
      />,
    );

    expect(screen.getByText(/STUDIO THIẾT KẾ TRẬN ĐẤU/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Chùa Một Cột')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://example.com/chua-mot-cot.jpg')).toBeInTheDocument();
    expect(screen.getByText('Câu 1')).toBeInTheDocument();
    expect(screen.getByText('Câu 16')).toBeInTheDocument();
  });

  it('calls onApplyCustomGame when valid configuration is submitted', () => {
    const handleApply = jest.fn();
    render(
      <GameStudioModal
        isOpen={true}
        onClose={jest.fn()}
        onApplyCustomGame={handleApply}
        initialConfig={mockInitialConfig}
      />,
    );

    const applyBtn = screen.getByRole('button', { name: /ÁP DỤNG ĐỀ THI VÀO TRẬN/i });
    fireEvent.click(applyBtn);

    expect(handleApply).toHaveBeenCalledWith(expect.objectContaining({
      secretMedia: expect.objectContaining({ keyword: 'Chùa Một Cột' }),
      questions: expect.arrayContaining([
        expect.objectContaining({ text: 'Câu hỏi mẫu số 1' }),
      ]),
    }));
  });
});
