export type CheckoutStatus = 'CREATED' | 'SUCCEEDED' | 'FAILED';
export type PaymentStatus = 'CREATED' | 'SUCCEEDED' | 'FAILED';
export interface CheckoutResult { provider: string; checkoutId: string; status: CheckoutStatus }
export interface PaymentProvider {
  createCheckout(input: { orderId: string; amount: number; currency: string; email: string }): Promise<CheckoutResult>;
  verifyCheckout(checkoutId: string): Promise<{ status: 'SUCCEEDED' | 'FAILED'; transactionId?: string; resultCode: string; resultDescription?: string }>;
}
export class DevelopmentPaymentProvider implements PaymentProvider {
  async createCheckout(input: { orderId: string; amount: number; currency: string; email: string }): Promise<CheckoutResult> {
    return { provider: 'development', checkoutId: `dev_checkout_${input.orderId}`, status: 'CREATED' };
  }
  async verifyCheckout(checkoutId: string) {
    return { status: 'SUCCEEDED' as const, transactionId: `dev_txn_${checkoutId}`, resultCode: '000.100.110', resultDescription: 'Development auto-confirmed payment' };
  }
}
export class HyperPayPaymentProvider implements PaymentProvider {
  constructor() {
    if (!process.env.HYPERPAY_ACCESS_TOKEN || !process.env.HYPERPAY_ENTITY_ID) throw new Error('HYPERPAY_ACCESS_TOKEN and HYPERPAY_ENTITY_ID are required when PAYMENT_PROVIDER=hyperpay');
  }
  private get baseUrl() { return (process.env.HYPERPAY_BASE_URL || 'https://test.oppwa.com').replace(/\/$/, ''); }
  async createCheckout(input: { orderId: string; amount: number; currency: string; email: string }): Promise<CheckoutResult> {
    const body = new URLSearchParams({ entityId: process.env.HYPERPAY_ENTITY_ID || '', amount: input.amount.toFixed(2), currency: input.currency, paymentType: process.env.HYPERPAY_PAYMENT_TYPE || 'DB', merchantTransactionId: input.orderId });
    const response = await fetch(`${this.baseUrl}/v1/checkouts`, { method: 'POST', headers: { Authorization: `Bearer ${process.env.HYPERPAY_ACCESS_TOKEN}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    const data = await response.json() as { id?: string; result?: { code?: string; description?: string } };
    if (!response.ok || !data.id) throw new Error(`HyperPay checkout failed: ${data.result?.code || response.status}`);
    return { provider: 'hyperpay', checkoutId: data.id, status: 'CREATED' };
  }
  async verifyCheckout(checkoutId: string) {
    const response = await fetch(`${this.baseUrl}/v1/checkouts/${encodeURIComponent(checkoutId)}?entityId=${process.env.HYPERPAY_ENTITY_ID}`, { headers: { Authorization: `Bearer ${process.env.HYPERPAY_ACCESS_TOKEN}` } });
    const data = await response.json() as { id?: string; result?: { code?: string; description?: string }; acquisitionCode?: string };
    const code = data.result?.code || '';
    const succeeded = response.ok && /^(000\.000\.|000\.100\.1|000\.3[0-9]{2}\.|000\.4)/.test(code);
    return { status: succeeded ? ('SUCCEEDED' as const) : ('FAILED' as const), transactionId: data.id || checkoutId, resultCode: code || String(response.status), resultDescription: data.result?.description };
  }
}
export function createPaymentProvider(): PaymentProvider { return (process.env.PAYMENT_PROVIDER || 'development').toLowerCase() === 'hyperpay' ? new HyperPayPaymentProvider() : new DevelopmentPaymentProvider(); }
