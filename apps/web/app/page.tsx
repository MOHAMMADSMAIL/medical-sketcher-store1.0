import HomeView from '@/components/store/HomeView';
import { API_URL } from '@/lib/api';

async function getProducts() {
  try {
    const response = await fetch(`${API_URL}/api/products`, { cache: 'no-store' });
    if (!response.ok) return [];
    return response.json();
  } catch {
    return [];
  }
}

export default async function Home() {
  const products = await getProducts();
  return <HomeView products={products} />;
}
