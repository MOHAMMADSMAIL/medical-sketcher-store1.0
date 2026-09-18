'use client';

import { use, useEffect, useState } from 'react';
import StoreChrome from '@/components/store/StoreChrome';
import { API_URL, api, money, ratingOf } from '@/lib/api';
import { useStore } from '@/components/store/StoreProvider';

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { t, user, addToCart, toggleWishlist, liked, toast } = useStore();
  const [book, setBook] = useState<any>(null);
  const [missing, setMissing] = useState(false);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/products/slug/${slug}`).then(async (response) => {
      if (!response.ok) { setMissing(true); return; }
      setBook(await response.json());
    }).catch(() => setMissing(true));
  }, [slug]);

  if (missing) return <StoreChrome><main className="px-5 py-24 text-center"><h1 className="serif text-5xl">Book not found</h1></main></StoreChrome>;
  if (!book) return <StoreChrome><main className="px-5 py-24 text-center">Loading…</main></StoreChrome>;

  async function submitReview(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api(`/products/${book.id}/reviews`, { method: 'POST', body: JSON.stringify({ rating, body }) });
      toast('Thank you — your review is live.');
      setBody('');
      const refreshed = await fetch(`${API_URL}/api/products/slug/${slug}`).then((r) => r.json());
      setBook(refreshed);
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Please sign in to review');
    }
  }

  return (
    <StoreChrome>
      <main className="mx-auto grid max-w-[1200px] gap-10 px-5 py-16 lg:grid-cols-[.8fr_1.2fr] lg:px-10">
        <div className="grid aspect-[.78] place-items-center rounded-[2rem] bg-[#566248] text-[#f1eddb]">
          <span className="serif text-7xl">{book.title.slice(0, 2).toUpperCase()}</span>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#777c60]">{book.category?.name} · Digital edition</p>
          <h1 className="serif mt-3 text-5xl lg:text-7xl">{book.title}</h1>
          <p className="mt-3 text-[#5d6458]">{book.author?.name}</p>
          <p className="mt-6 max-w-xl leading-7 text-[#515a4d]">{book.description}</p>
          <div className="mt-6 flex items-center gap-4">
            <strong className="text-2xl">{money(book.price, book.currency)}</strong>
            <span className="text-[#9b7335]">★ {ratingOf(book.reviews)}</span>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => void addToCart(book.id)} className="rounded-full bg-[#283224] px-6 py-3 text-sm font-semibold text-white">{t.add}</button>
            <button onClick={() => void toggleWishlist(book.id)} className="rounded-full border border-[#2c3325]/20 bg-white/60 px-6 py-3 text-sm">{liked.includes(book.id) ? '♥ Saved' : '♡ Wishlist'}</button>
          </div>
          <section className="mt-14 rounded-[2rem] border border-white/60 bg-[#f7f5ed]/70 p-6">
            <h2 className="serif text-3xl">Reviews</h2>
            <div className="mt-5 space-y-4">
              {(book.reviews || []).map((review: any) => (
                <p key={review.id} className="border-t border-[#536044]/10 pt-4 text-sm"><b>{'★'.repeat(review.rating)}</b> {review.body}<br /><span className="text-[#6d745e]">{review.user?.name || 'Reader'}</span></p>
              ))}
              {!book.reviews?.length && <p className="text-sm text-[#66705d]">Be the first to leave a review.</p>}
            </div>
            {user ? (
              <form onSubmit={submitReview} className="mt-6 grid gap-3">
                <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="rounded-xl border border-[#526047]/15 bg-white px-3 py-2">
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
                </select>
                <textarea required value={body} onChange={(e) => setBody(e.target.value)} className="min-h-24 rounded-xl border border-[#526047]/15 bg-white p-3" placeholder="Share how this book helped on shift." />
                <button className="rounded-full bg-[#33402e] px-5 py-3 text-sm font-semibold text-white">Submit review</button>
              </form>
            ) : <p className="mt-4 text-sm">Sign in to leave a review.</p>}
          </section>
        </div>
      </main>
    </StoreChrome>
  );
}
