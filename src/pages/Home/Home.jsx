import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, limit, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import HeroCarousel from '../../components/ui/HeroCarousel/HeroCarousel';
import CategoryBubbles from '../../components/ui/CategoryBubbles/CategoryBubbles';
import PromoBanners from '../../components/ui/PromoBanners/PromoBanners';
import ProductCarousel from '../../components/ui/ProductCarousel/ProductCarousel';
import FeaturedProductGrid from '../../components/ui/FeaturedProductGrid/FeaturedProductGrid';
import styles from './Home.module.css';
import Loading from '../../components/ui/Loading/Loading';
import { toast } from 'react-toastify'; // Importa o toast

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [bestSellers, setBestSellers] = useState([]);
  const [saleProducts, setSaleProducts] = useState([]);
  const [recommended, setRecommended] = useState([]);

  useEffect(() => {
    const fetchHomeProducts = async () => {
      try {
        const fetchCollection = async (q) => {
          const querySnapshot = await getDocs(q);
          return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        };

        // --- CORREÇÃO: Adiciona where('isActive', '==', true) ---
        const baseQuery = [where('isActive', '==', true)];

        // Query 1: Mais Vendidos (ativos, ordenados por vendas)
        const bestSellersQuery = query(
          collection(db, 'products'), 
          ...baseQuery, 
          orderBy('salesCount', 'desc'), 
          limit(8)
        );

        // Query 2: Em Promoção (ativos, em promoção)
        const saleProductsQuery = query(
          collection(db, 'products'), 
          ...baseQuery, 
          where('onSale', '==', true), 
          limit(8)
        );

        // Query 3: Recomendados (ativos, limite de 20)
        const recommendedQuery = query(
          collection(db, 'products'), 
          ...baseQuery, 
          limit(20)
        );
        // -------------------------------------------------------------
        
        const [bestSellersData, saleProductsData, recommendedData] = await Promise.all([
          fetchCollection(bestSellersQuery),
          fetchCollection(saleProductsQuery),
          fetchCollection(recommendedQuery),
        ]);

        setBestSellers(bestSellersData);
        setSaleProducts(saleProductsData);
        setRecommended(recommendedData);

      } catch (error) {
        console.error("Erro ao buscar produtos da Home: ", error);
        if (error.code === 'failed-precondition') {
          // Erro de Índice
          toast.error("Erro de índice no Firestore. Verifique o console (F12) para criar os índices.");
        } else {
          toast.error("Não foi possível carregar os produtos.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchHomeProducts();
  }, []);

  return (
    <div className={styles.homePage}>
      <HeroCarousel />
      <section className={`${styles.homeSection} ${styles.categorySection} container`}>
        <h2 className={styles.sectionTitle}>Navegue por Categorias</h2>
        <CategoryBubbles />
      </section>
      <section className={`${styles.homeSection} ${styles.promoSection}`}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Conheça Nossas Ofertas</h2>
          <PromoBanners />
        </div>
      </section>
      <section className={`${styles.homeSection} ${styles.productSection}`}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Mais Vendidos</h2>
        </div>
        {loading ? <Loading /> : <ProductCarousel products={bestSellers} />}
      </section>
      <section className={`${styles.homeSection} ${styles.saleSection}`}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Produtos que Baixaram o Preço</h2>
        </div>
        {loading ? <Loading /> : <ProductCarousel products={saleProducts} />}
      </section>
      <section className={`${styles.homeSection} ${styles.productSection}`}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Produtos para Você</h2>
        </div>
        {loading ? <Loading /> : <FeaturedProductGrid products={recommended} />}
      </section>
    </div>
  );
};
export default Home;