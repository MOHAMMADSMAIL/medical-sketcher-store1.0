'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StoreChrome from '@/components/store/StoreChrome';
import { API_URL, api } from '@/lib/api';
import { useStore } from '@/components/store/StoreProvider';

export default function LibraryPage() {
  const { user, t, toast } = useStore();
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    api<any[]>('/library').then(setItems).catch((err) => setError(err.message));
  }, [user]);

  async function download(productId: string, slug: string) {
    try {
      const response = await fetch(`${API_URL}/api/downloads/${productId}`, { credentials: 'include' });
      if (!response.ok) throw new Error(response.status === 403 ? 'Download permission not found' : 'Download failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${slug}.txt`;
      link.click();
      URL.revokeObjectURL(url);
      toast('Download started');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Download failed');
    }
  }

  return (
    <StoreChrome>
      <main className="mx-auto max-w-[900px] px-5 py-16">
        <h1 className="serif text-5xl">{t.library}</h1>
        {!user && <p className="mt-8">Please <Link className="underline" href="/login?next=/library">{t.signIn}</Link>.</p>}
        {error && <p className="mt-8">{error}</p>}
        {user && !items.length && !error && <p className="mt-8">{t.emptyLibrary}</p>}
        <div className="mt-8 grid gap-4">
          {items.map((item) => (
            <article key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-white/60 bg-[#f7f5ed]/75 p-5">
              <div>
                <h2 className="serif text-2xl">{item.product.title}</h2>
                <p className="text-sm text-[#66705d]">{item.product.author?.name} · purchased {new Date(item.createdAt || item.order?.createdAt || Date.now()).toLocaleDateString()}</p>
              </div>
              <button onClick={() => void download(item.productId, item.product.slug)} className="rounded-full bg-[#283224] px-5 py-2.5 text-sm font-semibold text-white">{t.download}</button>
            </article>
          ))}
        </div>
      </main>
    </StoreChrome>
  );
}
