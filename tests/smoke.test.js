import assert from 'node:assert/strict';
const products = await fetch('http://127.0.0.1:3102/api/products').then(r=>r.json());
assert.equal(products.products.length, 6);
const checkout = await fetch('http://127.0.0.1:3102/api/checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({items:[{id:'midnight-library',quantity:2}]})}).then(r=>r.json());
assert.equal(checkout.total,29.8);
console.log('Aurelia Books smoke test passed');
