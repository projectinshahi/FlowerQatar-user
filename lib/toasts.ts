/**
 * Toast messages, kept outside the app context on purpose: only ToastContainer reads them, so a
 * toast appearing or expiring re-renders that one component — not every product card, drawer
 * and the navbar, which is what happened while they lived in AppContext state.
 */

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

/**
 * How long a toast stays up before it dismisses itself. One value for every surface — the
 * cream storefront and the Blushing Blooms pages share the same ToastContainer.
 */
const TOAST_DURATION_MS = 3000;

const NONE: Toast[] = [];
let toasts: Toast[] = NONE;
const listeners = new Set<() => void>();

const set = (next: Toast[]) => {
  toasts = next;
  listeners.forEach((fn) => fn());
};

export const subscribeToasts = (fn: () => void) => {
  listeners.add(fn);
  return () => void listeners.delete(fn);
};
export const getToasts = () => toasts;
export const getServerToasts = () => NONE;

export function removeToast(id: string) {
  if (toasts.some((t) => t.id === id)) set(toasts.filter((t) => t.id !== id));
}

export function addToast(message: string, type: Toast['type'] = 'success') {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36);
  set([...toasts, { id, message, type }]);
  setTimeout(() => removeToast(id), TOAST_DURATION_MS);
}
