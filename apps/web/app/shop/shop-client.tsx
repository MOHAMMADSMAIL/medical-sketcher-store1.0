'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import StoreChrome from '@/components/store/StoreChrome';
import BookCard, { type Book } from '@/components/store/BookCard';
import { useStore } from '@/components/store/StoreProvider';

export default function ShopClient({ products }: { products: Book[] }) {
  const params = useSearchParams();
  const { t } = useStore();
  const search = (params.get('search') || params.get('q') || '').toLowerCase();
  const category = params.get('category') || '';
  const author = params.get('author') || '';
  const level = params.get('level') || '';
  const categories = useMemo(() => Array.from(new Set(products.map((p) => (typeof p.category === 'string' ? p.category : p.category?.name)).filter(Boolean))) as string[], [products]);
  const authors = useMemo(() => Array.from(new Set(products.map((p) => (typeof p.author === 'string' ? p.author : p.author?.name)).filter(Boolean))) as string[], [products]);
  const filtered = products.filter((book) => {
    const hay = `${book.title} ${typeof book.author === 'string' ? book.author : book.author?.name} ${typeof book.category === 'string' ? book.category : book.category?.name}`.toLowerCase();
    if (search && !hay.includes(search)) return false;
    if (category && (typeof book.category === 'string' ? book.category : book.category?.name) !== category) return false;
    if (author && (typeof book.author === 'string' ? book.author : book.author?.name) !== author) return false;
    if (level) {
      const anyMatch = products.some((item) => item.title.toLowerCase().includes(level.toLowerCase()));
      if (anyMatch && !hay.includes(level.toLowerCase())) return false;
    }
    return true;
  });
  return (
    <StoreChrome>
      <main className="mx-auto max-w-[1360px] px-5 py-16 lg:px-10">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-[#777c60]">The bookshelf</p>
        <h1 className="serif mt-3 text-5xl lg:text-7xl">{t.featured}</h1>
        <form className="mt-8 flex flex-wrap gap-3">
          <input name="search" defaultValue={search} placeholder="Search books…" className="min-w-60 flex-1 rounded-full border border-[#2c3325]/15 bg-white/70 px-5 py-3 text-sm outline-none" />
          <select name="category" defaultValue={category} className="rounded-full border border-[#2c3325]/15 bg-white/70 px-4 py-3 text-sm">
            <option value="">All categories</option>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select name="author" defaultValue={author} className="rounded-full border border-[#2c3325]/15 bg-white/70 px-4 py-3 text-sm">
            <option value="">All authors</option>
            {authors.map((item) => <option key={item}>{item}</option>)}
          </select>
          <button className="rounded-full bg-[#283224] px-5 py-3 text-sm font-semibold text-white">Filter</button>
        </form>
        {level && <p className="mt-4 text-sm text-[#66705d]">Showing titles related to {level}.</p>}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((book, index) => <BookCard key={book.id} book={book} index={index} />)}
        </div>
        {!filtered.length && <p className="mt-16 text-[#66705d]">No books match this filter yet.</p>}
      </main>
    </StoreChrome>
  );
}
