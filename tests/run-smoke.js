import { spawn } from 'node:child_process';
import { setTimeout as wait } from 'node:timers/promises';
const port = 3102;
const child = spawn(process.execPath, ['apps/api/src/main.js'], { env: { ...process.env, PORT: String(port) }, stdio: 'ignore' });
try {
  await wait(350);
  const products = await fetch(`http://127.0.0.1:${port}/api/products`).then(r => r.json());
  if (products.products.length !== 6) throw new Error('catalog smoke check failed');
  const checkout = await fetch(`http://127.0.0.1:${port}/api/checkout`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ items: [{ id: 'midnight-library', quantity: 2 }] }) }).then(r => r.json());
  if (checkout.total !== 29.8) throw new Error('checkout smoke check failed');
  console.log('Aurelia Books smoke test passed');
} finally { child.kill('SIGTERM'); }
