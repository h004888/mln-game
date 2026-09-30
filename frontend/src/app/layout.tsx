import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Buzzer Board Game — Đấu Trí Realtime',
  description: 'Trò chơi bấm chuông giành quyền mở ô và đoán ảnh bí ẩn',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className="antialiased selection:bg-game-neonCyan selection:text-black">
        {children}
      </body>
    </html>
  );
}
