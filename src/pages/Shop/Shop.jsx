import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import ProductCard from '../../components/ui/ProductCard/ProductCard';
import Loading from '../../components/ui/Loading/Loading';
import styles from './Shop.module.css';

/**
 * Página da Loja (Catálogo de Produtos).
 * - Busca dados da coleção 'products' no Firestore (Performance).
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
        const productsCollectionRef = collection(db, 'products');
        const querySnapshot = await getDocs(productsCollectionRef);
        
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productsData);
      } catch (err) {
        console.error("Erro ao buscar produtos: ", err);
        setError("Não foi possível carregar os produtos. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

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
        <p>Nenhum produto encontrado no momento.</p>
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