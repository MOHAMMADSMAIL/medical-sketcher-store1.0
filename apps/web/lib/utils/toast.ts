// Simple toast notifications utility
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

let toastId = 0;
const toasts: Map<string, Toast> = new Map();
const listeners: Set<(toasts: Map<string, Toast>) => void> = new Set();

export function showToast(message: string, type: ToastType = 'info', duration = 3000) {
  const id = `toast-${toastId++}`;
  const toast: Toast = { id, message, type, duration };
  toasts.set(id, toast);
  notifyListeners();

  setTimeout(() => {
    toasts.delete(id);
    notifyListeners();
  }, duration);

  return id;
}

function notifyListeners() {
  listeners.forEach(listener => listener(new Map(toasts)));
}

export function onToastChange(callback: (toasts: Map<string, Toast>) => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function removeToast(id: string) {
  toasts.delete(id);
  notifyListeners();
}
