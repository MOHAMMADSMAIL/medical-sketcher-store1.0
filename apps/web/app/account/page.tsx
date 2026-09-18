'use client';

import Link from 'next/link';
import StoreChrome from '@/components/store/StoreChrome';
import { useStore } from '@/components/store/StoreProvider';

export default function AccountPage() {
  const { user, t, logout } = useStore();
  return (
    <StoreChrome>
      <main className="mx-auto max-w-[640px] px-5 py-16">
        <h1 className="serif text-5xl">{t.account}</h1>
        {!user && <p className="mt-8">Please <Link className="underline" href="/login?next=/account">{t.signIn}</Link>.</p>}
        {user && (
          <div className="mt-8 rounded-[2rem] border border-white/60 bg-[#f7f5ed]/75 p-6">
            <p><b>{user.name || 'Reader'}</b></p>
            <p className="mt-1 text-sm text-[#66705d]">{user.email} · {user.role}</p>
            <div className="mt-6 grid gap-2 text-sm">
              <Link href="/library">{t.library} ↗</Link>
              <Link href="/orders">{t.orders} ↗</Link>
              <Link href="/wishlist">{t.wishlist} ↗</Link>
              {(user.role === 'OWNER' || user.role === 'ADMIN') && <Link href="/owner">Owner Studio ↗</Link>}
            </div>
            <button onClick={() => void logout()} className="mt-8 rounded-full border border-[#2c3325]/20 px-5 py-3 text-sm">Sign out</button>
          </div>
        )}
      </main>
    </StoreChrome>
  );
}
