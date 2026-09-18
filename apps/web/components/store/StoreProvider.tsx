'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { copy, type Lang } from '@/lib/i18n';

type User = { id: string; email: string; name?: string | null; role: string } | null;
type Cart = { items: any[]; subtotal: number; currency: string } | null;

type StoreContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (typeof copy)['EN'];
  rtl: boolean;
  user: User;
  cart: Cart;
  cartCount: number;
  liked: string[];
  notice: string;
  toast: (message: string) => void;
  refresh: () => Promise<void>;
  addToCart: (productId: string) => Promise<boolean>;
  toggleWishlist: (productId: string) => Promise<void>;
  logout: () => Promise<void>;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('EN');
  const [user, setUser] = useState<User>(null);
  const [cart, setCart] = useState<Cart>(null);
  const [liked, setLiked] = useState<string[]>([]);
  const [notice, setNotice] = useState('');

  const toast = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2600);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const me = await api<User>('/auth/me');
      setUser(me);
      const [nextCart, wishlist] = await Promise.all([
        api<Cart>('/cart'),
        api<{ productId: string }[]>('/wishlist'),
      ]);
      setCart(nextCart);
      setLiked(wishlist.map((item) => item.productId));
    } catch {
      setUser(null);
      setCart(null);
      setLiked([]);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const addToCart = useCallback(async (productId: string) => {
    try {
      const next = await api<Cart>('/cart/items', { method: 'POST', body: JSON.stringify({ productId, quantity: 1 }) });
      setCart(next);
      toast(copy[lang].added);
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        toast(copy[lang].signIn);
        window.location.href = `/login?next=/shop`;
        return false;
      }
      toast(error instanceof Error ? error.message : 'Could not add to cart');
      return false;
    }
  }, [lang, toast]);

  const toggleWishlist = useCallback(async (productId: string) => {
    const already = liked.includes(productId);
    try {
      if (already) {
        await api(`/wishlist/${productId}`, { method: 'DELETE' });
        setLiked((ids) => ids.filter((id) => id !== productId));
      } else {
        await api(`/wishlist/${productId}`, { method: 'POST' });
        setLiked((ids) => [...ids, productId]);
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.location.href = `/login?next=/wishlist`;
        return;
      }
      toast(error instanceof Error ? error.message : 'Wishlist unavailable');
    }
  }, [liked, toast]);

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' });
    setUser(null);
    setCart(null);
    setLiked([]);
    window.location.href = '/';
  }, []);

  const value = useMemo<StoreContextValue>(() => ({
    lang, setLang, t: copy[lang], rtl: lang === 'AR', user, cart,
    cartCount: cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
    liked, notice, toast, refresh, addToCart, toggleWishlist, logout,
  }), [lang, user, cart, liked, notice, toast, refresh, addToCart, toggleWishlist, logout]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useStore must be used inside StoreProvider');
  return value;
}
