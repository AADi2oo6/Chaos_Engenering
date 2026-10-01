import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CheckCircle2, Flame, Shield, ArrowRight } from 'lucide-react';

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 md:p-12 max-w-5xl mx-auto">
      <header className="flex justify-between items-center py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            H
          </div>
          <span className="font-semibold text-xl tracking-tight text-white">HabitOS</span>
        </div>
        <div className="flex gap-4 items-center">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20"
          >
            Get Started
          </Link>
        </div>
      </header>

      <main className="my-auto py-16 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-12">
        <div className="max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
            Hackathon MVP • Phase 1
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Build good habits. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
              Protect streaks with kindness.
            </span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Set daily targets for reading, walking, study, and more. Track streaks, enjoy 1 weekly recovery token, visualize your last 7 days, and monitor your explainable consistency score.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center md:justify-start">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:gap-3"
            >
              Start Building Habits <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 font-semibold text-slate-300 transition-colors"
            >
              Sign In to Dashboard
            </Link>
          </div>
        </div>

        <div className="w-full max-w-sm bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-sm space-y-5">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Today's Focus</span>
              <h3 className="font-bold text-slate-200">📖 Reading</h3>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
              <Flame className="h-3.5 w-3.5 text-amber-400" />
              7 Day Streak
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400 font-medium">
              <span>Target: 10 pages</span>
              <span className="text-emerald-400 font-bold">12 logged (120%)</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full w-full" />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Shield className="h-4 w-4 text-cyan-400" />
              <span>Weekly Recovery</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-medium">1 Available</span>
          </div>

          <div className="space-y-1.5 pt-2">
            <span className="text-xs text-slate-500 font-semibold">Last 7 Days</span>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-slate-500">{day}</span>
                  <div
                    className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                      idx === 3
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {idx === 3 ? '🛟' : '✓'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 border-t border-slate-900 text-center text-xs text-slate-500">
        Chaos_Engenering • Core MVP • Built with Next.js, Supabase & TypeScript
      </footer>
    </div>
  );
}
