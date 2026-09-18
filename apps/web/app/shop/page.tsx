import { Suspense } from 'react';
import ShopClient from './shop-client';
import { API_URL } from '@/lib/api';

export default async function ShopPage() {
  let products: any[] = [];
  try {
    const response = await fetch(`${API_URL}/api/products`, { cache: 'no-store' });
    if (response.ok) products = await response.json();
  } catch {}
  return <Suspense><ShopClient products={products} /></Suspense>;
}
