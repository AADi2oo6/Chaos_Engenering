'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f4f4f5] text-[#09090b]">
      <div className="w-full max-w-md bg-white border-[3px] border-black p-6 sm:p-8 shadow-[6px_6px_0px_0px_#09090b] space-y-6">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-black hover:text-[#ea580c] transition-colors mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> [ BACK TO SYSTEM HOME ]
          </Link>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-3 h-3 bg-black inline-block" />
            <h1 className="text-2xl font-black uppercase tracking-tight">OPERATOR ACCESS</h1>
          </div>
          <p className="text-xs font-mono text-zinc-600">
            AUTHENTICATE CREDENTIALS TO LOAD HABIT DASHBOARD.
          </p>
        </div>

        {error && (
          <div className="p-3.5 border-2 border-black bg-red-50 text-[#dc2626] font-mono text-xs flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold uppercase">AUTHENTICATION FAILED</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block font-bold uppercase tracking-wider text-black mb-1.5" htmlFor="email">
              USER IDENTIFIER / EMAIL *
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@system.io"
              className="w-full px-3.5 py-2.5 bg-white border-2 border-black text-black text-sm placeholder:text-zinc-400 focus:outline-none focus:border-[#ea580c] transition-colors font-mono"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-black mb-1.5" htmlFor="password">
              SECURITY KEY / PASSWORD *
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 bg-white border-2 border-black text-black text-sm placeholder:text-zinc-400 focus:outline-none focus:border-[#ea580c] transition-colors font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-brutal-primary py-3 text-sm flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'AUTHENTICATE & ENTER'}
          </button>
        </form>

        <div className="pt-4 border-t-2 border-black text-center font-mono text-xs text-zinc-600">
          NEW OPERATOR?{' '}
          <Link href="/signup" className="text-black font-black uppercase underline hover:text-[#ea580c]">
            INITIALIZE ACCOUNT
          </Link>
        </div>
      </div>
    </div>
  );
}
