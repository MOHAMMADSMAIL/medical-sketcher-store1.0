'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import StoreChrome from '@/components/store/StoreChrome';
import { api } from '@/lib/api';
import { useStore } from '@/components/store/StoreProvider';

export default function LoginForm() {
  const { t, refresh } = useStore();
  const params = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      await refresh();
      router.push(params.get('next') || '/');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Invalid credentials');
    }
  }

  return (
    <StoreChrome>
      <main className="mx-auto max-w-[480px] px-5 py-20">
        <h1 className="serif text-5xl">{t.signIn}</h1>
        <form onSubmit={submit} className="mt-8 grid gap-4 rounded-[2rem] border border-white/60 bg-[#f7f5ed]/75 p-6">
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="rounded-xl border border-[#526047]/15 bg-white px-4 py-3" />
          <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="rounded-xl border border-[#526047]/15 bg-white px-4 py-3" />
          <button className="rounded-full bg-[#283224] py-3 text-sm font-semibold text-white">{t.signIn}</button>
          {status && <p className="text-sm text-[#8a5047]">{status}</p>}
        </form>
        <p className="mt-6 text-sm">Need an account? <Link className="underline" href="/register">{t.register}</Link></p>
      </main>
    </StoreChrome>
  );
}
