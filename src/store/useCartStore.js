import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Store global para o Carrinho de Compras.
 * - Usa 'persist' middleware para salvar no localStorage (requisito anônimo).
 * - Fornece ações para adicionar, remover e atualizar itens.
 * (UI/UX de Excelência: carrinho persiste entre sessões)
 */
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // Array de { id, nome, preco, imagem, quantity }

      // Ação para adicionar um item ao carrinho
      addItem: (product, quantity = 1) => {
        const { items } = get();
        const existingItemIndex = items.findIndex(item => item.id === product.id);

        if (existingItemIndex > -1) {
          // Se o item já existe, atualiza a quantidade
          const updatedItems = items.map((item, index) =>
            index === existingItemIndex
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
          set({ items: updatedItems });
        } else {
          // Se é um item novo
          const newItem = {
            id: product.id,
            nome: product.nome,
            preco: product.preco,
            imagem: product.imagens[0] || '',
            quantity: quantity,
          };
          set({ items: [...items, newItem] });
        }
      },

      // Ação para remover um item
      removeItem: (productId) => {
        set({ items: get().items.filter(item => item.id !== productId) });
      },

      // Ação para atualizar a quantidade
      updateQuantity: (productId, quantity) => {
        const newQuantity = Math.max(0, quantity); // Garante que não seja negativo
        if (newQuantity === 0) {
          get().removeItem(productId);
        } else {
          set({
            items: get().items.map(item =>
              item.id === productId ? { ...item, quantity: newQuantity } : item
            ),
          });
        }
      },

      // Ação para limpar o carrinho (usado após o checkout)
      clearCart: () => {
        set({ items: [] });
      },

      // TODO: Adicionar lógica para 'syncCart' com o Firestore 
      // quando o usuário (do useAuthStore) fizer login.
    }),
    {
      name: 'fina-estampa-cart', // Chave no localStorage
    }
  )
);