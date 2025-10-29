import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Store global para o Carrinho de Compras (Atualizado).
 * - Salva no localStorage (persist).
 * - Lida com a nova arquitetura de variantes (ID único por cor/tamanho).
 * (Princípios: Arquitetura Escalável, Performance Total)
 */
export const useCartStore = create(
  persist(
    (set, get) => ({
      /**
       * O array 'items' agora espera objetos com esta estrutura:
       * { 
       * id: "productId-Color-Size", (ex: "p1-Vinho-P")
       * productId: "p1",
       * nome: "Camiseta",
       * imagem: "url/...",
       * price: 99.90,
       * color: "Vinho",
       * size: "P",
       * quantity: 1 
       * }
       */
      items: [], 

      /**
       * Adiciona um item ao carrinho ou incrementa a quantidade.
       * @param {object} productToAdd - O objeto da variante do produto.
       * @param {number} quantity - A quantidade a adicionar.
       */
      addItem: (productToAdd, quantity = 1) => {
        const { items } = get();
        
        // O ID de 'productToAdd' já é o ID único da variante (ex: "p1-Vinho-P")
        const existingItemIndex = items.findIndex(item => item.id === productToAdd.id);

        if (existingItemIndex > -1) {
          // --- Item já existe: Atualiza a quantidade ---
          const updatedItems = items.map((item, index) =>
            index === existingItemIndex
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
          set({ items: updatedItems });
        } else {
          // --- Item novo: Adiciona ao array ---
          const newItem = {
            ...productToAdd,
            quantity: quantity, // Adiciona a propriedade 'quantity'
          };
          set({ items: [...items, newItem] });
        }
      },

      /**
       * Remove um item completamente do carrinho.
       * @param {string} cartItemId - O ID único da variante (ex: "p1-Vinho-P")
       */
      removeItem: (cartItemId) => {
        set({ items: get().items.filter(item => item.id !== cartItemId) });
      },

      /**
       * Atualiza a quantidade de um item específico.
       * @param {string} cartItemId - O ID único da variante
       * @param {number} quantity - A nova quantidade total
       */
      updateQuantity: (cartItemId, quantity) => {
        const newQuantity = Math.max(0, quantity); // Garante que não seja negativo
        
        if (newQuantity === 0) {
          // Se a quantidade for 0, remove o item
          get().removeItem(cartItemId);
        } else {
          // Atualiza a quantidade do item específico
          set({
            items: get().items.map(item =>
              item.id === cartItemId ? { ...item, quantity: newQuantity } : item
            ),
          });
        }
      },

      /**
       * Limpa o carrinho (usado após o checkout).
       */
      clearCart: () => {
        set({ items: [] });
      },

      // TODO: Adicionar lógica 'syncCart' para mesclar com o Firestore
      // quando o usuário fizer login.
    }),
    {
      name: 'fina-estampa-cart', // Chave no localStorage
    }
  )
);