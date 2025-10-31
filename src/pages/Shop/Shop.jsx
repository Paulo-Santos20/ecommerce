import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom'; // 1. Importa o hook
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import ProductCard from '../../components/ui/ProductCard/ProductCard';
import Loading from '../../components/ui/Loading/Loading';
import styles from './Shop.module.css';

/**
 * Página da Loja (Catálogo de Produtos).
 * ATUALIZADO: Agora lê a URL para filtrar por categoria.
 */
const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 2. Pega os parâmetros da URL
  const [searchParams] = useSearchParams();
  const categoriaFiltro = searchParams.get('categoria'); // Ex: "feminino"

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const productsCollectionRef = collection(db, 'products');
        
        // 3. Cria a query base
        let q; 

        if (categoriaFiltro) {
          // --- Se houver um filtro, aplica o 'where' ---
          q = query(
            productsCollectionRef, 
            where('categoria', '==', categoriaFiltro),
            orderBy('nome')
          );
        } else {
          // --- Se não houver filtro, busca todos ---
          q = query(
            productsCollectionRef, 
            orderBy('nome')
          );
        }
        
        // 4. Executa a query
        const querySnapshot = await getDocs(q);
        
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productsData);
      } catch (err) {
        console.error("Erro ao buscar produtos: ", err);
        // O erro mais comum aqui será de "Índice não encontrado"
        if (err.code === 'failed-precondition') {
            setError(`O índice para este filtro ("${categoriaFiltro}") ainda não foi criado no Firestore. Verifique o console do navegador pelo link de criação.`);
        } else {
            setError("Não foi possível carregar os produtos.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoriaFiltro]); // 5. Re-executa a busca se o filtro mudar

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="container">
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  return (
    <div className="container">
      {/* 6. Título dinâmico */}
      <h1 className={styles.pageTitle}>
        {categoriaFiltro ? `Categoria: ${categoriaFiltro}` : 'Nossa Coleção'}
      </h1>
      
      {products.length === 0 ? (
        <div className={styles.emptyShop}>
          <h2>Nenhum produto encontrado</h2>
          <p>Parece que não há produtos para "{categoriaFiltro}".</p>
          <a href="/loja" className={styles.ctaButton}>Ver todos os produtos</a>
        </div>
      ) : (
        <div className={styles.productsGrid}>
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Shop;