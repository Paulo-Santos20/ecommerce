import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import ProductCard from '../../components/ui/ProductCard/ProductCard';
import Loading from '../../components/ui/Loading/Loading';
import styles from './Shop.module.css';
import { toast } from 'react-toastify';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchParams] = useSearchParams();
  const categoriaFiltro = searchParams.get('categoria');
  const searchQuery = searchParams.get('q'); 
  
  const [pageTitle, setPageTitle] = useState('Nossa Coleção');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const productsCollectionRef = collection(db, 'products');
        
        // --- CORREÇÃO: Adiciona where('isActive', '==', true) ---
        let q;
        const baseQuery = [where('isActive', '==', true)]; // Filtro base

        if (categoriaFiltro) {
          setPageTitle(`Categoria: ${categoriaFiltro}`);
          q = query(
            productsCollectionRef, 
            ...baseQuery, 
            where('categoria', '==', categoriaFiltro), 
            orderBy('nome')
          );
        } else {
          setPageTitle(searchQuery ? `Resultados para: "${searchQuery}"` : 'Nossa Coleção');
          q = query(
            productsCollectionRef, 
            ...baseQuery, 
            orderBy('nome')
          );
        }
        // -------------------------------------------------------------
        
        const querySnapshot = await getDocs(q);
        
        let productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Filtro de Busca (Client-Side)
        if (searchQuery) {
          const lowerCaseQuery = searchQuery.toLowerCase();
          productsData = productsData.filter(product => 
            product.nome.toLowerCase().includes(lowerCaseQuery) ||
            product.categoria.toLowerCase().includes(lowerCaseQuery)
          );
        }

        setProducts(productsData);
      } catch (err) {
        console.error("Erro ao buscar produtos: ", err);
        if (err.code === 'failed-precondition') {
            const errorMsg = `O índice para este filtro ("${categoriaFiltro || 'todos'}") ainda não foi criado no Firestore.`;
            setError(errorMsg + " Abra o console (F12) para ver o link de criação.");
            toast.error(errorMsg);
        } else {
            setError("Não foi possível carregar os produtos.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoriaFiltro, searchQuery]); 

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
      <h1 className={styles.pageTitle}>{pageTitle}</h1>
      
      {products.length === 0 ? (
        <div className={styles.emptyShop}>
          <h2>Nenhum produto encontrado</h2>
          <p>Não encontramos produtos para esta seleção. Tente um filtro diferente.</p>
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