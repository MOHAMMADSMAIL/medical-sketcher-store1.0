'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StoreChrome from '@/components/store/StoreChrome';
import { api, money } from '@/lib/api';
import { useStore } from '@/components/store/StoreProvider';

export default function OrdersPage() {
  const { user, t } = useStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    api<any[]>('/orders').then(setOrders).catch((err) => setError(err.message));
  }, [user]);

  return (
    <StoreChrome>
      <main className="mx-auto max-w-[900px] px-5 py-16">
        <h1 className="serif text-5xl">{t.orders}</h1>
        {!user && <p className="mt-8">Please <Link className="underline" href="/login?next=/orders">{t.signIn}</Link>.</p>}
        {error && <p className="mt-8">{error}</p>}
        {user && !orders.length && !error && <p className="mt-8">No orders yet.</p>}
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="rounded-[1.5rem] border border-white/60 bg-[#f7f5ed]/75 p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <b>#{order.id.slice(0, 8)}</b>
                <span className="rounded-full bg-[#dce6d0] px-3 py-1 text-xs">{order.status} · {order.payments?.[0]?.status || 'UNPAID'}</span>
              </div>
              <p className="mt-2 text-sm text-[#66705d]">{new Date(order.createdAt).toLocaleString()} · {money(order.total, order.currency)}</p>
              {order.items.map((item: any) => <p key={item.id} className="mt-1 text-sm">{item.product.title} × {item.quantity}</p>)}
            </article>
          ))}
        </div>
      </main>
    </StoreChrome>
  );
}
