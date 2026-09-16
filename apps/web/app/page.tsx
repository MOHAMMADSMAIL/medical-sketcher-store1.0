import HomeClient from './home-client';

async function getProducts() {
  try {
    const response = await fetch(`${process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/products`, { cache: 'no-store' });
    if (!response.ok) return [];
    return response.json();
  } catch {
    return [];
  }
}
export default async function Home() {
  const products = await getProducts();
  return <HomeClient products={products} />;
}
