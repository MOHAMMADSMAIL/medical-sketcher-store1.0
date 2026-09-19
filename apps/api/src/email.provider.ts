export type EmailTemplate = 'order-confirmation' | 'payment-confirmation' | 'password-reset' | 'download-ready';
export interface EmailProvider { send(input: { to: string; template: EmailTemplate; variables?: Record<string, string> }): Promise<void>; }
const escapeHtml = (value = '') => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
function message(template: EmailTemplate, variables: Record<string, string> = {}) {
  const v = Object.fromEntries(Object.entries(variables).map(([key, value]) => [key, escapeHtml(value)]));
  switch (template) {
    case 'order-confirmation': return { subject: `Order received${v.orderId ? `: ${v.orderId}` : ''}`, html: `<h1>Order received</h1><p>We received your order${v.orderId ? ` <strong>${v.orderId}</strong>` : ''}. We will email you once payment is confirmed.</p>` };
    case 'payment-confirmation': return { subject: `Payment confirmed${v.orderId ? `: ${v.orderId}` : ''}`, html: '<h1>Payment confirmed</h1><p>Your purchased books are now available in your library.</p>' };
    case 'download-ready': return { subject: 'Your digital book is ready', html: `<h1>Your download is ready</h1><p>${v.productTitle || 'Your purchased book'} is available in your library.</p>` };
    case 'password-reset': return { subject: 'Reset your password', html: `<h1>Reset your password</h1><p>Use this link within ${v.expiresIn || '60 minutes'}:</p><p><a href="${v.resetUrl}">Reset password</a></p>` };
  }
}
export class ConsoleEmailProvider implements EmailProvider { async send(input: { to: string; template: EmailTemplate; variables?: Record<string, string> }) { console.info(`[email:console] ${input.template} -> ${input.to}`, input.variables || {}); } }
export class ResendEmailProvider implements EmailProvider {
  constructor() { if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is required when EMAIL_PROVIDER=resend'); }
  async send(input: { to: string; template: EmailTemplate; variables?: Record<string, string> }) {
    const content = message(input.template, input.variables);
    const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: process.env.EMAIL_FROM || 'Aurelia Books <onboarding@resend.dev>', to: [input.to], subject: content.subject, html: content.html }) });
    if (!response.ok) throw new Error(`Resend delivery failed: ${response.status}`);
  }
}
export function createEmailProvider(): EmailProvider { return (process.env.EMAIL_PROVIDER || 'console').toLowerCase() === 'resend' ? new ResendEmailProvider() : new ConsoleEmailProvider(); }
