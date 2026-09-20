'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import StoreChrome from '@/components/store/StoreChrome';
import { api } from '@/lib/api';
import { useStore } from '@/components/store/StoreProvider';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3000').replace(/\/$/, '');

export default function LoginForm() {
  const { t, refresh } = useStore();
  const params = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [mode, setMode] = useState<'password' | 'phone'>('password');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const next = params.get('next') || '/';

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      await refresh();
      router.push(next);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Invalid credentials');
    } finally {
      setBusy(false);
    }
  }

  async function requestCode(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setStatus('');
    try {
      await api('/auth/phone/request', { method: 'POST', body: JSON.stringify({ phone }) });
      setCodeSent(true);
      setStatus('Code sent — check your messages. (Development builds show the code in the API console / error until SMS is configured.)');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not send code');
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await api('/auth/phone/verify', { method: 'POST', body: JSON.stringify({ phone, code }) });
      await refresh();
      router.push(next);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Invalid code');
    } finally {
      setBusy(false);
    }
  }

  return (
    <StoreChrome>
      <main className="mx-auto max-w-[480px] px-5 py-20">
        <h1 className="serif text-5xl">{t.signIn}</h1>

        {/* Customer-only Google sign-in (task 7). Never linked from the owner login. */}
        <a
          href={`${API_BASE}/api/auth/google?next=${encodeURIComponent(next)}`}
          className="mt-8 flex items-center justify-center gap-3 rounded-full border border-[#526047]/25 bg-white px-4 py-3 text-sm font-semibold text-[#283224]"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26a5.4 5.4 0 0 1-8.09-2.85H.96v2.33A9 9 0 0 0 9 18z" />
            <path fill="#FBBC05" d="M3.95 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l2.99-2.33z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.96l2.99 2.33A5.36 5.36 0 0 1 9 3.58z" />
          </svg>
          {t.continueGoogle}
        </a>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-[#66705d]">
          <span className="h-px flex-1 bg-[#526047]/15" /> {t.orDivider} <span className="h-px flex-1 bg-[#526047]/15" />
        </div>

        <div className="flex gap-2 text-sm">
          <button type="button" onClick={() => { setMode('password'); setStatus(''); }} className={`flex-1 rounded-full px-4 py-2 ${mode === 'password' ? 'bg-[#283224] text-white' : 'border border-[#526047]/25'}`}>{t.emailTab}</button>
          <button type="button" onClick={() => { setMode('phone'); setStatus(''); setCodeSent(false); }} className={`flex-1 rounded-full px-4 py-2 ${mode === 'phone' ? 'bg-[#283224] text-white' : 'border border-[#526047]/25'}`}>{t.phoneTab}</button>
        </div>

        {mode === 'password' && (
          <form onSubmit={submit} className="mt-4 grid gap-4 rounded-[2rem] border border-white/60 bg-[#f7f5ed]/75 p-6">
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="rounded-xl border border-[#526047]/15 bg-white px-4 py-3" />
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="rounded-xl border border-[#526047]/15 bg-white px-4 py-3" />
            <button disabled={busy} className="rounded-full bg-[#283224] py-3 text-sm font-semibold text-white">{t.signIn}</button>
          </form>
        )}

        {mode === 'phone' && !codeSent && (
          <form onSubmit={requestCode} className="mt-4 grid gap-4 rounded-[2rem] border border-white/60 bg-[#f7f5ed]/75 p-6">
            <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+962 7…" className="rounded-xl border border-[#526047]/15 bg-white px-4 py-3" />
            <button disabled={busy} className="rounded-full bg-[#283224] py-3 text-sm font-semibold text-white">{t.sendCode}</button>
            <p className="text-xs text-[#66705d]">{t.codeSentHint}</p>
          </form>
        )}

        {mode === 'phone' && codeSent && (
          <form onSubmit={verifyCode} className="mt-4 grid gap-4 rounded-[2rem] border border-white/60 bg-[#f7f5ed]/75 p-6">
            <input required inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="6-digit code" className="rounded-xl border border-[#526047]/15 bg-white px-4 py-3 text-center text-lg tracking-[0.4em]" />
            <button disabled={busy} className="rounded-full bg-[#283224] py-3 text-sm font-semibold text-white">{t.verifySignIn}</button>
          </form>
        )}

        {status && <p className="mt-3 text-sm text-[#8a5047]">{status}</p>}

        <p className="mt-6 text-sm">Need an account? <Link className="underline" href="/register">{t.register}</Link></p>
      </main>
    </StoreChrome>
  );
}
