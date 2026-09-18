'use client';
import StoreChrome from '@/components/store/StoreChrome';
import Link from 'next/link';

export default function NotFound() {
  return (
    <StoreChrome>
      <main className="px-5 py-24 text-center">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-[#777c60]">404</p>
        <h1 className="serif mt-4 text-6xl">This page wandered off.</h1>
        <Link href="/" className="mt-8 inline-block rounded-full bg-[#283224] px-6 py-3 text-sm text-white">Back home</Link>
      </main>
    </StoreChrome>
  );
}
