export type PaymentStatus = 'CREATED' | 'SUCCEEDED' | 'FAILED';
export interface PaymentProvider {
  createCheckout(input: { orderId: string; amount: number; currency: string; email?: string }): Promise<{ provider: string; checkoutId: string; status: PaymentStatus }>;
  verifyCheckout(checkoutId: string): Promise<{ provider: string; checkoutId: string; transactionId?: string; resultCode: string; resultDescription?: string; status: 'SUCCEEDED' | 'FAILED' }>;
}

export class HyperPayProvider implements PaymentProvider {
  private readonly baseUrl = (process.env.HYPERPAY_BASE_URL || 'https://test.oppwa.com').replace(/\/$/, '');
  private readonly entityId = process.env.HYPERPAY_ENTITY_ID!;
  private readonly token = process.env.HYPERPAY_ACCESS_TOKEN!;
  private readonly paymentType = process.env.HYPERPAY_PAYMENT_TYPE || 'DB';
  private async request(path: string, init: RequestInit) {
    const response = await fetch(`${this.baseUrl}${path}`, { ...init, headers: { Authorization: `Bearer ${this.token}`, ...(init.headers || {}) } });
    const body = await response.json() as any;
    if (!response.ok) throw new Error(`HyperPay ${response.status}: ${JSON.stringify(body)}`);
    return body;
  }
  async createCheckout(input: { orderId: string; amount: number; currency: string; email?: string }) {
    const params = new URLSearchParams({ entityId: this.entityId, amount: input.amount.toFixed(2), currency: input.currency, paymentType: this.paymentType, merchantTransactionId: input.orderId, shopperResultUrl: `${process.env.WEB_URL || 'http://localhost:3001'}/checkout/result` });
    if (input.email) params.set('customer.email', input.email);
    const body = await this.request('/v1/checkouts', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params });
    const code = String(body.result?.code || '');
    return { provider: 'hyperpay', checkoutId: String(body.id), status: /^000\.|^000\.000\./.test(code) ? 'CREATED' as const : 'FAILED' as const };
  }
  async verifyCheckout(checkoutId: string) {
    const body = await this.request(`/v1/checkouts/${encodeURIComponent(checkoutId)}/payment?entityId=${encodeURIComponent(this.entityId)}`, { method: 'GET' });
    const code = String(body.result?.code || '');
    const success = /^(000\.000\.|000\.100\.1|000\.100\.2|000\.100\.3|000\.000\.100)/.test(code);
    return { provider: 'hyperpay', checkoutId, transactionId: body.id ? String(body.id) : undefined, resultCode: code, resultDescription: body.result?.description, status: success ? 'SUCCEEDED' as const : 'FAILED' as const };
  }
}

export function createPaymentProvider(): PaymentProvider {
  if ((process.env.PAYMENT_PROVIDER || 'development').toLowerCase() === 'hyperpay') {
    if (!process.env.HYPERPAY_ENTITY_ID || !process.env.HYPERPAY_ACCESS_TOKEN) throw new Error('HYPERPAY_ENTITY_ID and HYPERPAY_ACCESS_TOKEN are required');
    return new HyperPayProvider();
  }
  return { async createCheckout(input) { return { provider: 'development', checkoutId: `dev_${input.orderId}`, status: 'CREATED' }; }, async verifyCheckout(checkoutId) { return { provider: 'development', checkoutId, transactionId: `dev_tx_${checkoutId}`, resultCode: '000.000.000', status: 'SUCCEEDED' }; } };
}
