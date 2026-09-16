import type { ReactNode } from 'react';
import './globals.css';
export const metadata = { title: 'Medical Sketcher Store', description: 'A considered digital library for beautifully curious minds.' };
export default function RootLayout({ children }: { children: ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
