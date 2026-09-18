'use client';

import { useState } from 'react';
import Link from 'next/link';
import StoreChrome from '@/components/store/StoreChrome';
import { api, money } from '@/lib/api';
import { useStore } from '@/components/store/StoreProvider';

export default function CheckoutPage() {
  const { cart, user, t, refresh, toast } = useStore();
  const [status, setStatus] = useState('');
  const [orderId, setOrderId] = useState('');

  async function pay() {
    setStatus('Creating order…');
    try {
      const order = await api<any>('/orders', { method: 'POST', body: '{}' });
      const payment = await api<any>('/payments/create', { method: 'POST', body: JSON.stringify({ orderId: order.id }) });
      await api(`/payments/${payment.id}/confirm`, { method: 'POST', body: '{}' });
      setOrderId(order.id);
      setStatus('Payment succeeded — open your library');
      toast('Payment succeeded');
      await refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Payment failed');
    }
  }

  return (
    <StoreChrome>
      <main className="mx-auto max-w-[720px] px-5 py-16">
        <h1 className="serif text-5xl">{t.checkout}</h1>
        {!user && <p className="mt-8">Please <Link className="underline" href="/login?next=/checkout">{t.signIn}</Link> first.</p>}
        {user && !cart?.items?.length && !orderId && <p className="mt-8">{t.emptyCart}</p>}
        <div className="mt-8 space-y-3">
          {cart?.items?.map((item: any) => <p key={item.id}>{item.product.title} × {item.quantity} — {money(item.lineTotal, cart.currency)}</p>)}
        </div>
        {!!cart?.items?.length && <p className="mt-4 font-semibold">Total {money(cart.subtotal, cart.currency)}</p>}
        <p className="mt-2 text-sm text-[#66705d]">Development payment — no real card is charged.</p>
        <button disabled={!user || !cart?.items?.length} onClick={() => void pay()} className="mt-8 rounded-full bg-[#283224] px-6 py-3 text-sm font-semibold text-white disabled:opacity-40">{t.pay}</button>
        {status && <p className="mt-4">{status} {orderId && <Link className="underline" href="/library">{t.library} ↗</Link>}</p>}
      </main>
    </StoreChrome>
  );
}
