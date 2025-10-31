import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, query } from 'firebase/firestore';

const SearchContext = createContext();

export const useSearch = () => {
  return useContext(SearchContext);
};

export const SearchProvider = ({ children }) => {
  const [searchIndex, setSearchIndex] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSearchIndex = async () => {
      try {
        // 1. Busca Categorias
        const categoriesRef = collection(db, 'categories');
        const categoriesSnap = await getDocs(categoriesRef);
        const categoriesData = categoriesSnap.docs.map(doc => ({
          id: doc.id,
          name: doc.data().nome,
          type: 'categoria',
          // --- ADICIONADO: Imagem placeholder para categoria ---
          image: `https://via.placeholder.com/50/800000/FFFFFF?text=${doc.data().nome.charAt(0)}` 
        }));

        // 2. Busca Produtos
        const productsRef = collection(db, 'products');
        const productsQuery = query(productsRef); // Busca o documento completo
        const productsSnap = await getDocs(productsQuery);
        
        const productsData = productsSnap.docs.map(doc => {
          const data = doc.data();
          // --- CORREÇÃO: Pega a imagem principal do produto ---
          const imageUrl = (data.images && data.images.length > 0)
            ? data.images[data.mainImageIndex || 0]
            : 'https://via.placeholder.com/50'; // Fallback
            
          return {
            id: doc.id,
            name: data.nome,
            type: 'produto',
            image: imageUrl // <-- Passa a imagem para o índice
          };
        });
        
        setSearchIndex([...categoriesData, ...productsData]);
        
      } catch (error) {
        console.error("Erro ao construir índice de busca:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSearchIndex();
  }, []); 

  const getSuggestions = (term) => {
    if (!term || term.length < 2 || isLoading) {
      return [];
    }
    const lowerCaseTerm = term.toLowerCase();
    return searchIndex.filter(item => 
      item.name && item.name.toLowerCase().includes(lowerCaseTerm)
    ).slice(0, 5); 
  };

  const value = {
    getSuggestions,
    isLoadingIndex: isLoading,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};