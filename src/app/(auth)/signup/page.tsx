'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setSuccessMsg('ACCOUNT REGISTERED SUCCESSFULLY. PROCEED TO AUTHENTICATION.');
        setLoading(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during signup');
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
            <span className="w-3 h-3 bg-[#ea580c] inline-block" />
            <h1 className="text-2xl font-black uppercase tracking-tight">NEW REGISTRATION</h1>
          </div>
          <p className="text-xs font-mono text-zinc-600">
            PROVISION PROFILE AND COMMENCE STREAK TELEMETRY.
          </p>
        </div>

        {error && (
          <div className="p-3.5 border-2 border-black bg-red-50 text-[#dc2626] font-mono text-xs flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold uppercase">REGISTRATION ERROR</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 border-2 border-black bg-emerald-50 text-[#16a34a] font-mono text-xs flex items-start gap-2.5">
            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold uppercase">{successMsg}</div>
              <Link href="/login" className="text-black font-black uppercase underline hover:text-[#ea580c] block mt-1">
                [ PROCEED TO LOGIN ]
              </Link>
            </div>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block font-bold uppercase tracking-wider text-black mb-1.5" htmlFor="name">
              OPERATOR HANDLE / NAME *
            </label>
            <input
              id="name"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="ADITYA"
              className="w-full px-3.5 py-2.5 bg-white border-2 border-black text-black text-sm placeholder:text-zinc-400 focus:outline-none focus:border-[#ea580c] transition-colors font-mono"
            />
          </div>

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
              SECURITY KEY / PASSWORD (MIN 6 CHARS) *
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
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
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'INITIALIZE & DEPLOY PROFILE'}
          </button>
        </form>

        <div className="pt-4 border-t-2 border-black text-center font-mono text-xs text-zinc-600">
          ALREADY REGISTERED?{' '}
          <Link href="/login" className="text-black font-black uppercase underline hover:text-[#ea580c]">
            AUTHENTICATE HERE
          </Link>
        </div>
      </div>
    </div>
  );
}
