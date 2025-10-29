import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';

import HeroCarousel from '../../components/ui/HeroCarousel/HeroCarousel';
import CategoryBubbles from '../../components/ui/CategoryBubbles/CategoryBubbles';
import PromoBanners from '../../components/ui/PromoBanners/PromoBanners';
import ProductCarousel from '../../components/ui/ProductCarousel/ProductCarousel';
import FeaturedProductGrid from '../../components/ui/FeaturedProductGrid/FeaturedProductGrid';
import styles from './Home.module.css';
import Loading from '../../components/ui/Loading/Loading';

/**
 * Página Home. (Controladora de Layout)
 * CORRIGIDO: Busca produtos usando 'onSale == true'
 */
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

        // 1. Busca "Mais Vendidos" (Query: Apenas 8 produtos aleatórios)
        const bestSellersQuery = query(
          collection(db, 'products'),
          limit(8)
        );
        
        // 2. Busca "Preços Baixos" (Query: onde 'onSale' é true)
        // --- ESTA É A LINHA CORRIGIDA ---
        const saleProductsQuery = query(
          collection(db, 'products'),
          where('onSale', '==', true), // Busca pela flag de promoção
          limit(8)
        );
        // ---------------------------------

        // 3. Busca "Para Você" (Query: Apenas 20 produtos aleatórios)
        const recommendedQuery = query(
          collection(db, 'products'),
          limit(20)
        );

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
        // Se der erro, precisamos verificar se o índice do Firestore foi criado.
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

      {/* 4. Seção "Mais Vendidos" */}
      <section className={`${styles.homeSection} ${styles.productSection}`}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Mais Vendidos</h2>
        </div>
        {loading ? <Loading /> : <ProductCarousel products={bestSellers} />}
      </section>

      {/* 5. Seção "Preços Baixos" */}
      <section className={`${styles.homeSection} ${styles.saleSection}`}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Produtos que Baixaram o Preço</h2>
        </div>
        {/* Agora vai exibir produtos se houver algum com 'onSale: true' */}
        {loading ? <Loading /> : <ProductCarousel products={saleProducts} />}
      </section>

      {/* 6. Seção "Produtos para Você" */}
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