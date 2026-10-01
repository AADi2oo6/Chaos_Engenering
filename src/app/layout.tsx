import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CHAOS ENGINEERING // HABIT SYSTEM',
  description: 'Industrial high-contrast habit consistency and streak resilience engine.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-white text-[#09090b] min-h-screen antialiased selection:bg-[#ea580c] selection:text-white">
        {children}
      </body>
    </html>
  );
}
