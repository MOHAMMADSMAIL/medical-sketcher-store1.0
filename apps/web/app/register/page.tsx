'use client';

import { useState } from 'react';
import Link from 'next/link';
import StoreChrome from '@/components/store/StoreChrome';
import { api } from '@/lib/api';
import { useStore } from '@/components/store/StoreProvider';

export default function RegisterPage() {
  const { t } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3000').replace(/\/$/, '');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
      setStatus('Account created — you can sign in now.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Registration failed');
    }
  }

  return (
    <StoreChrome>
      <main className="mx-auto max-w-[480px] px-5 py-20">
        <h1 className="serif text-5xl">{t.register}</h1>
        <a
          href={`${API_BASE}/api/auth/google?next=${encodeURIComponent('/')}`}
          className="mt-8 flex items-center justify-center gap-3 rounded-full border border-[#526047]/25 bg-white px-4 py-3 text-sm font-semibold text-[#283224]"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26a5.4 5.4 0 0 1-8.09-2.85H.96v2.33A9 9 0 0 0 9 18z" />
            <path fill="#FBBC05" d="M3.95 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l2.99-2.33z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.96l2.99 2.33A5.36 5.36 0 0 1 9 3.58z" />
          </svg>
          Continue with Google
        </a>
        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-[#66705d]">
          <span className="h-px flex-1 bg-[#526047]/15" /> or register with email <span className="h-px flex-1 bg-[#526047]/15" />
        </div>
        <form onSubmit={submit} className="mt-8 grid gap-4 rounded-[2rem] border border-white/60 bg-[#f7f5ed]/75 p-6">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="rounded-xl border border-[#526047]/15 bg-white px-4 py-3" />
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="rounded-xl border border-[#526047]/15 bg-white px-4 py-3" />
          <input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (8+ characters)" className="rounded-xl border border-[#526047]/15 bg-white px-4 py-3" />
          <button className="rounded-full bg-[#283224] py-3 text-sm font-semibold text-white">{t.register}</button>
          {status && <p className="text-sm">{status}</p>}
        </form>
        <p className="mt-6 text-sm">Already registered? <Link className="underline" href="/login">{t.signIn}</Link></p>
      </main>
    </StoreChrome>
  );
}
