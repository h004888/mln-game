import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { HostLoginModal } from './HostLoginModal';

describe('HostLoginModal', () => {
  it('renders Host PIN input and submits pin on submit', () => {
    const handleAuthenticate = jest.fn();
    render(
      <HostLoginModal
        isOpen={true}
        onAuthenticate={handleAuthenticate}
        errorMessage={null}
      />,
    );

    expect(screen.getByText(/XÁC THỰC QUYỀN MC/i)).toBeInTheDocument();
    const input = screen.getByPlaceholderText(/Nhập mã PIN MC/i);
    const submitBtn = screen.getByRole('button', { name: /MỞ KHÓA BẢNG ĐIỀU KHIỂN/i });

    fireEvent.change(input, { target: { value: '8888' } });
    fireEvent.click(submitBtn);

    expect(handleAuthenticate).toHaveBeenCalledWith('8888');
  });

  it('displays error message when provided', () => {
    render(
      <HostLoginModal
        isOpen={true}
        onAuthenticate={jest.fn()}
        errorMessage="Mã PIN không chính xác!"
      />,
    );

    expect(screen.getByText('Mã PIN không chính xác!')).toBeInTheDocument();
  });
});
