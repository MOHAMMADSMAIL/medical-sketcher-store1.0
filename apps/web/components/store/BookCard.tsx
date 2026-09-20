'use client';

import Link from 'next/link';
import { API_URL, coverColor, money, ratingOf } from '@/lib/api';
import { tr } from '@/lib/i18n';
import { useStore } from './StoreProvider';

export type Book = {
  id: string;
  slug: string;
  title: string;
  price: number | string;
  currency?: string;
  description?: string;
  type?: string;
  author?: { name?: string } | string | null;
  category?: { name?: string } | string;
  media?: { id: string; type?: string | null; mimeType?: string }[];
  reviews?: { rating: number }[];
};

export default function BookCard({ book, index = 0, onHover }: { book: Book; index?: number; onHover?: (index: number | null) => void }) {
  const { t, lang, liked, addToCart, toggleWishlist } = useStore();
  const author = typeof book.author === 'string' ? book.author : book.author?.name || 'Medical Sketcher';
  const category = typeof book.category === 'string' ? book.category : book.category?.name || 'Pathway';
  const mark = book.title.match(/\b(A1|A2|B1|B2|C1|C2)\b/)?.[1] || book.title.slice(0, 2).toUpperCase();
  // Prefer the newest cover: uploads append, so the last match is current.
  const cover = [...(book.media || [])].reverse().find((m) => m.type === 'cover');
  const coverUrl = cover ? `${API_URL}/api/products/media/${cover.id}` : null;
  return (
    <article onMouseEnter={() => onHover?.((index + 1) % 5)} onMouseLeave={() => onHover?.(null)} className="group rounded-[1.75rem] border border-white/60 bg-[#f5f3ea]/75 p-3 transition duration-300 hover:-translate-y-2 hover:shadow-2xl">
      <Link href={`/shop/${book.slug}`}>
        <div className="relative grid aspect-[.78] place-items-center overflow-hidden rounded-[1.25rem]" style={{ backgroundColor: coverColor(index) }}>
          {coverUrl
            ? <img src={coverUrl} alt={book.title} className="absolute inset-0 h-full w-full object-cover" />
            : <span className="serif border-y border-white/30 px-4 py-3 text-5xl text-[#f1eddb]">{mark}</span>}
          <button type="button" aria-label="Add to wishlist" onClick={(event) => { event.preventDefault(); void toggleWishlist(book.id); }} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/80 text-lg">{liked.includes(book.id) ? '♥' : '♡'}</button>
          <span className="absolute bottom-3 left-3 rounded-full bg-black/20 px-2 py-1 text-[10px] text-white backdrop-blur">{tr(lang, book.type === 'merch' ? 'Store item' : 'Digital edition', book.type === 'merch' ? 'منتج من المتجر' : 'نسخة رقمية', book.type === 'merch' ? 'Shop-Artikel' : 'Digitale Ausgabe')}</span>
        </div>
      </Link>
      <div className="px-2 pb-2 pt-4">
        <p className="text-[11px] text-[#6d745e]">{category}</p>
        <Link href={`/shop/${book.slug}`}><h3 className="serif mt-1 text-xl">{book.title}</h3></Link>
        <p className="mt-1 text-sm text-[#62695c]">{author}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-semibold">{money(book.price, book.currency)}</span>
          <span className="text-xs text-[#9b7335]">★ {ratingOf(book.reviews)}</span>
        </div>
        <button onClick={() => void addToCart(book.id)} className="mt-4 w-full rounded-xl bg-[#2d3829] py-2.5 text-sm font-semibold text-white transition hover:bg-[#536044]">{t.add}</button>
      </div>
    </article>
  );
}
