import React from 'react';
import { render, screen } from '@testing-library/react';
import { BoardGrid } from './BoardGrid';
import { Card } from '../../types/game';

describe('BoardGrid', () => {
  const mockCards: Card[] = [
    {
      id: 'c1',
      index: 1,
      isOpened: false,
      question: { id: 'q1', text: 'Q1', options: ['A', 'B', 'C', 'D'], correctIndex: 0 },
    },
    {
      id: 'c2',
      index: 2,
      isOpened: true,
      openedBy: 'Nguyen Van A',
      question: { id: 'q2', text: 'Q2', options: ['A', 'B', 'C', 'D'], correctIndex: 1 },
    },
  ];

  it('renders unopened cards with numbers and opened cards with content', () => {
    render(
      <BoardGrid
        cards={mockCards}
        secretImageUrl="https://images.unsplash.com/test.jpg"
      />,
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Nguyen Van A')).toBeInTheDocument();
  });
});
