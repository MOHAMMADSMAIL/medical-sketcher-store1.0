export type PaymentStatus = 'CREATED' | 'SUCCEEDED' | 'FAILED';
export interface PaymentProvider { createPayment(input: { orderId: string; amount: number; currency: string; idempotencyKey: string }): Promise<{ provider: string; transactionId: string; status: PaymentStatus }>; }
export class DevelopmentPaymentProvider implements PaymentProvider {
  async createPayment(input: { orderId: string; amount: number; currency: string; idempotencyKey: string }) { return { provider: 'development', transactionId: `dev_${input.idempotencyKey}`, status: 'SUCCEEDED' as const }; }
}
