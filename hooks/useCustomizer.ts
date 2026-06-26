import { useApp } from '../context/AppContext';

export function useCustomizer() {
  const { customizer, updateCustomizer, resetCustomizer } = useApp();

  return {
    customizer,
    updateCustomizer,
    resetCustomizer,
  };
}
