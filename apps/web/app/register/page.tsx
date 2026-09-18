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
