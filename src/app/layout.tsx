import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HabitOS — Evidence-Driven Habit Tracker',
  description: 'Build consistent habits, protect streaks with kindness, and track verifiable progress.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
