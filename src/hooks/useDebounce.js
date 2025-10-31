import { useState, useEffect } from 'react';

/**
 * Hook customizado para "debounce".
 * Atraso na atualização de um valor, útil para buscas.
 * (Princípio: Performance Total)
 * * @param value O valor a ser "atrasado" (ex: o termo da busca)
 * @param delay O tempo de atraso em milissegundos
 * @returns O valor "atrasado"
 */
function useDebounce(value, delay) {
  // Estado para o valor "atrasado"
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Inicia um timer. Só atualiza o 'debouncedValue'
    // depois que o 'delay' passar.
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpa o timer se o 'value' mudar (ex: usuário digitou outra letra)
    // Isso cancela a atualização anterior e reinicia o timer.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Só re-executa se o valor ou o atraso mudarem

  return debouncedValue;
}

export default useDebounce;