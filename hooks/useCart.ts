import { useApp } from '../context/AppContext';

export function useCart() {
  const {
    cart,
    isCartOpen,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    setCartOpen,
    getCartTotal,
    getCartCount,
  } = useApp();

  return {
    cart,
    isCartOpen,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    setCartOpen,
    getCartTotal,
    getCartCount,
  };
}
