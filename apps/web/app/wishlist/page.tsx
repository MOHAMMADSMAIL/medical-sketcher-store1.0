'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StoreChrome from '@/components/store/StoreChrome';
import { api } from '@/lib/api';
import { useStore } from '@/components/store/StoreProvider';

export default function WishlistPage() {
  const { user, t, addToCart, toggleWishlist } = useStore();
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    api<any[]>('/wishlist').then(setItems).catch((err) => setError(err.message));
  }, [user]);

  return (
    <StoreChrome>
      <main className="mx-auto max-w-[900px] px-5 py-16">
        <h1 className="serif text-5xl">{t.wishlist}</h1>
        {!user && <p className="mt-8">Please <Link className="underline" href="/login?next=/wishlist">{t.signIn}</Link>.</p>}
        {error && <p className="mt-8">{error}</p>}
        {user && !items.length && !error && <p className="mt-8">{t.emptyWishlist}</p>}
        <div className="mt-8 space-y-4">
          {items.map((item) => (
            <article key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-white/60 bg-[#f7f5ed]/75 p-5">
              <Link href={`/shop/${item.product.slug}`} className="serif text-2xl">{item.product.title}</Link>
              <div className="flex gap-3">
                <button onClick={() => void addToCart(item.productId)} className="rounded-full bg-[#283224] px-4 py-2 text-sm text-white">{t.add}</button>
                <button onClick={async () => { await toggleWishlist(item.productId); setItems((current) => current.filter((entry) => entry.productId !== item.productId)); }} className="text-sm">Remove</button>
              </div>
            </article>
          ))}
        </div>
      </main>
    </StoreChrome>
  );
}
