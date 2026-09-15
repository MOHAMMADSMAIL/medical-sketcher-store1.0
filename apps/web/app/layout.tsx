import type { ReactNode } from 'react';
export const metadata = { title: 'Aurelia Books', description: 'A considered collection for beautifully curious readers.' };
export default function RootLayout({ children }: { children: ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
