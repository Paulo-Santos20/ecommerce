import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import ProductCard from '../../components/ui/ProductCard/ProductCard';
import Loading from '../../components/ui/Loading/Loading';
import styles from './Shop.module.css';

/**
 * Página da Loja (Catálogo de Produtos).
 * - Busca dados REAIS da coleção 'products' no Firestore.
 * - Exibe estados de Loading e Erro (UI/UX).
 * - Renderiza os produtos em um grid responsivo (Mobile-First).
 */
const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        // Cria a consulta ao Firestore, ordenando por nome
        const productsCollectionRef = collection(db, 'products');
        const q = query(productsCollectionRef, orderBy('nome'));
        
        const querySnapshot = await getDocs(q);
        
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productsData);
      } catch (err) {
        console.error("Erro ao buscar produtos: ", err);
        setError("Não foi possível carregar os produtos. Verifique sua conexão ou tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []); // Executa apenas uma vez

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
      <h1 className={styles.pageTitle}>Nossa Coleção</h1>
      {/* TODO: Adicionar Filtros (Categoria, Preço) */}
      
      {products.length === 0 ? (
        <div className={styles.emptyShop}>
          <h2>Nenhum produto encontrado</h2>
          <p>Parece que ainda não cadastramos produtos nesta categoria. Tente novamente mais tarde!</p>
          <p>Você é um administrador? <a href="/admin">Adicione produtos aqui</a>.</p>
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