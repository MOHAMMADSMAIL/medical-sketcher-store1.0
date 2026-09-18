'use client';
import { StoreProvider } from '@/components/store/StoreProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <StoreProvider>{children}</StoreProvider>;
}
