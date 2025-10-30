import { useState, useCallback } from 'react';

const STORAGE_KEY = 'fina_estampa_recently_viewed';
const MAX_ITEMS = 12; // Salva no máximo os últimos 12 itens

/**
 * Hook para gerenciar a lista de IDs de produtos vistos recentemente
 * armazenados no localStorage.
 * (Princípios: Performance Total, Código de Alta Qualidade)
 */
export const useRecentlyViewed = () => {
    // 1. Tenta ler a lista do localStorage na inicialização
    const getInitialViewed = () => {
        try {
            const item = window.localStorage.getItem(STORAGE_KEY);
            return item ? JSON.parse(item) : [];
        } catch (error) {
            console.warn("Erro ao ler 'recently viewed' do localStorage", error);
            return [];
        }
    };

    // O estado 'viewedProductIds' é usado para que
    // componentes (como a página /ultimos-vistos) possam re-renderizar
    const [viewedProductIds, setViewedProductIds] = useState(getInitialViewed);

    /**
     * Adiciona um ID de produto à lista de "vistos recentemente".
     * Coloca o ID no topo, remove duplicatas e limita o tamanho da lista.
     */
    const addProduct = useCallback((productId) => {
        if (!productId) return;

        setViewedProductIds((prevIds) => {
            // 1. Remove o ID se ele já existir (para movê-lo para o topo)
            const filteredIds = prevIds.filter(id => id !== productId);
            
            // 2. Adiciona o novo ID no início (mais recente)
            const newIds = [productId, ...filteredIds];
            
            // 3. Limita o tamanho do array
            const limitedIds = newIds.slice(0, MAX_ITEMS);

            // 4. Salva no localStorage
            try {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedIds));
            } catch (error) {
                console.warn("Erro ao salvar 'recently viewed' no localStorage", error);
            }

            // 5. Retorna o novo estado
            return limitedIds;
        });
    }, []); // useCallback para performance

    // Retorna a lista de IDs e a função para adicionar
    return { viewedProductIds, addProduct };
};