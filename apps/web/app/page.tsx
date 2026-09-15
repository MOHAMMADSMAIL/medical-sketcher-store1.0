async function getProducts() {
  const response = await fetch(`${process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/products`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Catalog unavailable');
  return response.json();
}
export default async function Home() {
  const products = await getProducts();
  return <main style={{padding: '4rem', fontFamily: 'Georgia, serif'}}><p style={{letterSpacing:'.2em'}}>AURELIA BOOKS</p><h1>Books for the <i>beautifully curious.</i></h1><section style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1rem'}}>{products.map((book: any)=><article key={book.id}><h2>{book.title}</h2><p>{book.author?.name || 'Aurelia Books'}</p><p>${Number(book.price).toFixed(2)}</p></article>)}</section></main>;
}
