import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import ProductCard from '../../components/ui/ProductCard/ProductCard';
import Loading from '../../components/ui/Loading/Loading';
import styles from './Shop.module.css';

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
        const q = query(productsCollectionRef, orderBy('nome'));
        const querySnapshot = await getDocs(q);
        const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(productsData);
      } catch (err) {
        console.error("Erro ao buscar produtos: ", err);
        setError("Não foi possível carregar os produtos.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) return <Loading />;
  if (error) return ( <div className="container"><p className={styles.error}>{error}</p></div> );

  return (
    <div className="container">
      <h1 className={styles.pageTitle}>Nossa Coleção</h1>
      {products.length === 0 ? (
        <div className={styles.emptyShop}>
          <h2>Nenhum produto encontrado</h2>
          <p>Parece que ainda não cadastramos produtos. Tente novamente mais tarde!</p>
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