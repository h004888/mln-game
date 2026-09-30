import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Buzzer Board Game — Đấu Trí Realtime',
  description: 'Trò chơi bấm chuông giành quyền mở ô và đoán ảnh bí ẩn',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="antialiased selection:bg-game-neonCyan selection:text-black">
        {children}
      </body>
    </html>
  );
}
