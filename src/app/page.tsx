import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ArrowRight, Flame, Shield, Activity, Terminal } from 'lucide-react';

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-white text-[#09090b] flex flex-col justify-between">
      {/* Top Engineering Header */}
      <header className="border-b-[3px] border-black bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black flex items-center justify-center text-white font-mono font-black text-base border-2 border-black shadow-[2px_2px_0px_0px_#ea580c]">
              ◈
            </div>
            <div>
              <span className="font-mono font-black text-sm md:text-base tracking-tight uppercase">
                CHAOS // HABIT SYSTEM
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-mono px-1.5 py-0.5 bg-zinc-100 border border-black text-zinc-700">
                v1.0-STABLE
              </span>
            </div>
          </div>
          <div className="flex gap-3 items-center font-mono">
            <Link
              href="/login"
              className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-black hover:text-[#ea580c] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="btn-brutal-primary"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Bold Statement */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-zinc-100 border-2 border-black text-xs font-mono font-bold uppercase">
              <span className="w-2 h-2 bg-[#ea580c] inline-block animate-pulse" />
              SYSTEM PROTOCOL // PHASE 1 MVP
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight leading-[0.95]">
              BUILD HABITS. <br />
              <span className="text-[#ea580c] bg-black text-white px-2 py-0.5 inline-block mt-2">
                RECOVER
              </span>{' '}
              FROM CHAOS.
            </h1>

            <p className="text-base sm:text-lg text-zinc-700 max-w-xl font-medium leading-relaxed">
              Industrial habit tracking built on deterministic streak resilience. Set daily targets, monitor verifiable completion, protect unbroken chains with 1 kind weekly recovery token, and inspect your explainable consistency index.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-4 font-mono">
              <Link
                href="/signup"
                className="btn-brutal-primary text-sm px-6 py-3.5"
              >
                <span>INITIALIZE SYSTEM</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="btn-brutal-secondary text-sm px-6 py-3.5"
              >
                ACCESS TERMINAL
              </Link>
            </div>

            <div className="pt-6 grid grid-cols-3 gap-3 max-w-lg border-t-2 border-black font-mono text-xs">
              <div>
                <div className="font-bold text-black uppercase">STREAK LOSS</div>
                <div className="text-zinc-500">KIND RECOVERY</div>
              </div>
              <div>
                <div className="font-bold text-black uppercase">SCORING</div>
                <div className="text-zinc-500">0–100 INDEX</div>
              </div>
              <div>
                <div className="font-bold text-black uppercase">TELEMETRY</div>
                <div className="text-zinc-500">7-DAY MATRIX</div>
              </div>
            </div>
          </div>

          {/* Right Column: Industrial Diagnostic Preview Card */}
          <div className="lg:col-span-5">
            <div className="border-[3px] border-black bg-white p-6 shadow-[6px_6px_0px_0px_#09090b] space-y-6">
              {/* Card Title Bar */}
              <div className="flex justify-between items-center border-b-2 border-black pb-3 font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-black" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    OPERATIONAL UNIT 01
                  </span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 bg-black text-white uppercase">
                  ACTIVE
                </span>
              </div>

              {/* Habit Details */}
              <div className="space-y-1">
                <div className="text-xs font-mono uppercase text-zinc-500 font-bold">
                  HABIT TARGET
                </div>
                <div className="text-2xl font-black uppercase tracking-tight flex justify-between items-center">
                  <span>READING</span>
                  <span className="font-mono text-sm bg-zinc-100 border border-black px-2 py-0.5">
                    10 PAGES/DAY
                  </span>
                </div>
              </div>

              {/* Today's Target vs Actual */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-mono font-bold">
                  <span className="text-zinc-600">TODAY'S EXECUTION</span>
                  <span className="text-[#ea580c] font-black">12 / 10 PAGES (120%)</span>
                </div>
                <div className="h-4 w-full bg-zinc-200 border-2 border-black p-0.5">
                  <div className="h-full bg-[#ea580c] w-full" />
                </div>
              </div>

              {/* Status and Streak */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="border-2 border-black p-3 bg-zinc-50 font-mono">
                  <div className="text-[10px] uppercase text-zinc-500 font-bold">STATUS</div>
                  <div className="text-xs font-black uppercase text-black bg-white border border-black px-1.5 py-0.5 inline-block mt-1">
                    ■ COMPLETED
                  </div>
                </div>

                <div className="border-2 border-black p-3 bg-zinc-50 font-mono">
                  <div className="text-[10px] uppercase text-zinc-500 font-bold">CURRENT STREAK</div>
                  <div className="text-lg font-black text-[#ea580c] mt-0.5">
                    08 DAYS
                  </div>
                </div>
              </div>

              {/* 7-Day Matrix */}
              <div className="space-y-2 pt-2 border-t-2 border-black">
                <div className="flex justify-between text-xs font-mono font-bold">
                  <span>7-DAY TELEMETRY MATRIX</span>
                  <span className="text-zinc-500">MON → SUN</span>
                </div>
                <div className="grid grid-cols-7 gap-1 font-mono text-center">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-zinc-500">{day}</span>
                      <div
                        className={`h-7 flex items-center justify-center font-bold text-xs border-2 border-black ${
                          idx === 3
                            ? 'bg-[#ea580c] text-black'
                            : idx === 6
                            ? 'bg-white text-zinc-400'
                            : 'bg-black text-white'
                        }`}
                      >
                        {idx === 3 ? '↺' : idx === 6 ? '·' : '■'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recovery Status Banner */}
              <div className="p-3 border-2 border-black bg-zinc-100 flex items-center justify-between font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#ea580c]" />
                  <span className="font-bold uppercase">WEEKLY RECOVERY:</span>
                </div>
                <span className="font-black text-[#ea580c] bg-white border border-black px-2 py-0.5">
                  01 TOKEN READY
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Industrial Footer */}
      <footer className="border-t-[3px] border-black bg-zinc-100 py-4 font-mono text-xs">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="font-bold uppercase">
            ◈ CHAOS ENGINEERING // CORE MVP // SYSTEM OPERATIONAL
          </div>
          <div className="text-zinc-500">
            NEXT.JS 15 • SUPABASE POSTGRESQL • HIGH-CONTRAST INDUSTRIAL SPEC
          </div>
        </div>
      </footer>
    </div>
  );
}
