import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EVeM Chat - 社内AIアシスタント',
  description: 'EVeM Japan社内向けAIチャットアプリケーション',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen gradient-bg">
        {children}
      </body>
    </html>
  );
}

