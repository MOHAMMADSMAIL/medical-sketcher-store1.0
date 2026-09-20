'use client';

import { useState } from 'react';
import Link from 'next/link';
import StoreChrome from '@/components/store/StoreChrome';
import { api } from '@/lib/api';
import { useStore } from '@/components/store/StoreProvider';

export default function AccountPage() {
  const { user, t, logout, refresh } = useStore();
  const [phone, setPhone] = useState('');
  const [phoneStatus, setPhoneStatus] = useState('');

  async function linkPhone(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api('/auth/phone/link', { method: 'POST', body: JSON.stringify({ phone }) });
      setPhoneStatus('Phone number linked ✓');
      await refresh();
    } catch (error) {
      setPhoneStatus(error instanceof Error ? error.message : 'Could not link phone');
    }
  }

  return (
    <StoreChrome>
      <main className="mx-auto max-w-[640px] px-5 py-16">
        <h1 className="serif text-5xl">{t.account}</h1>
        {!user && <p className="mt-8">Please <Link className="underline" href="/login?next=/account">{t.signIn}</Link>.</p>}
        {user && (
          <div className="mt-8 grid gap-6">
            <div className="rounded-[2rem] border border-white/60 bg-[#f7f5ed]/75 p-6">
              <p><b>{user.name || 'Reader'}</b></p>
              <p className="mt-1 text-sm text-[#66705d]">{user.email} · {user.role}</p>
              {user.phoneNumber && <p className="mt-1 text-sm text-[#66705d]">📞 {user.phoneNumber}{user.phoneVerifiedAt ? ' · verified' : ''}</p>}
              <div className="mt-6 grid gap-2 text-sm">
                <Link href="/library">{t.library} ↗</Link>
                <Link href="/orders">{t.orders} ↗</Link>
                <Link href="/wishlist">{t.wishlist} ↗</Link>
                {(user.role === 'OWNER' || user.role === 'ADMIN') && <Link href="/owner">Owner Studio ↗</Link>}
              </div>
              <button onClick={() => void logout()} className="mt-8 rounded-full border border-[#2c3325]/20 px-5 py-3 text-sm">Sign out</button>
            </div>

            {/* Task 7: attach a phone number so the owner can identify the buyer. */}
            <form onSubmit={linkPhone} className="rounded-[2rem] border border-white/60 bg-[#f7f5ed]/75 p-6">
              <p className="text-sm font-semibold">Phone number</p>
              <p className="mt-1 text-xs text-[#66705d]">Optional — lets us identify your orders and enables phone sign-in.</p>
              <div className="mt-3 flex gap-2">
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+962 7…" className="flex-1 rounded-xl border border-[#526047]/15 bg-white px-4 py-3" />
                <button className="rounded-full bg-[#283224] px-6 py-3 text-sm font-semibold text-white">Link</button>
              </div>
              {phoneStatus && <p className="mt-2 text-sm text-[#8a5047]">{phoneStatus}</p>}
            </form>
          </div>
        )}
      </main>
    </StoreChrome>
  );
}
