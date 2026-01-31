import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EVeM DNA Chat - 大事にしたい思想や経営方針について',
  description: 'EVeM Japan - 大事にしたい思想や経営方針についてのAIチャット',
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

