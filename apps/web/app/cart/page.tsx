'use client';

import Link from 'next/link';
import StoreChrome from '@/components/store/StoreChrome';
import { api, money } from '@/lib/api';
import { useStore } from '@/components/store/StoreProvider';

export default function CartPage() {
  const { cart, user, t, refresh, toast } = useStore();

  async function update(id: string, quantity: number) {
    try {
      await api(`/cart/items/${id}`, { method: 'PATCH', body: JSON.stringify({ quantity }) });
      await refresh();
    } catch (error) { toast(error instanceof Error ? error.message : 'Could not update cart'); }
  }
  async function remove(id: string) {
    try {
      await api(`/cart/items/${id}`, { method: 'DELETE' });
      await refresh();
    } catch (error) { toast(error instanceof Error ? error.message : 'Could not remove item'); }
  }

  return (
    <StoreChrome>
      <main className="mx-auto max-w-[900px] px-5 py-16 lg:px-10">
        <h1 className="serif text-5xl">{t.cart}</h1>
        {!user && <p className="mt-8">{t.signIn} to keep your cart across devices. <Link className="underline" href="/login?next=/cart">{t.signIn}</Link></p>}
        {user && !cart?.items?.length && <p className="mt-8">{t.emptyCart} <Link className="underline" href="/shop">{t.shop}</Link></p>}
        <div className="mt-8 divide-y divide-[#536044]/15 rounded-[2rem] border border-white/60 bg-[#f7f5ed]/70">
          {cart?.items?.map((item: any) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <Link href={`/shop/${item.product.slug}`} className="serif text-2xl">{item.product.title}</Link>
                <p className="text-sm text-[#66705d]">{item.product.author?.name}</p>
              </div>
              <div className="flex items-center gap-3">
                <input type="number" min={1} max={99} value={item.quantity} onChange={(e) => void update(item.id, Number(e.target.value))} className="w-16 rounded-xl border border-[#526047]/15 bg-white px-2 py-2 text-center" />
                <b>{money(item.lineTotal, cart.currency)}</b>
                <button onClick={() => void remove(item.id)} className="text-sm text-[#8a5047]">Remove</button>
              </div>
            </div>
          ))}
        </div>
        {!!cart?.items?.length && (
          <div className="mt-8 flex items-center justify-between">
            <strong className="text-xl">Total {money(cart.subtotal, cart.currency)}</strong>
            <Link href="/checkout" className="rounded-full bg-[#283224] px-6 py-3 text-sm font-semibold text-white">{t.checkout}</Link>
          </div>
        )}
      </main>
    </StoreChrome>
  );
}
