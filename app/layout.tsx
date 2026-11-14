import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { SettingsProvider } from '@/components/shared/theme-provider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'MagicTool AI — Nền Tảng Sáng Tạo Ảnh & Video AI',
  description: 'Không gian làm việc sáng tạo giúp bạn chuyển ý tưởng thành hình ảnh và video chuyên nghiệp.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-purple-500 selection:text-white`}>
        <SettingsProvider>{children}</SettingsProvider>
      </body>
    </html>
  );
}
