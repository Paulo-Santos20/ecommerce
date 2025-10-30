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
        const bestSellersQuery = query(collection(db, 'products'), orderBy('salesCount', 'desc'), limit(8));
        const saleProductsQuery = query(collection(db, 'products'), where('onSale', '==', true), limit(8));
        const recommendedQuery = query(collection(db, 'products'), limit(20));
        
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
        // Tenta carregar sem os filtros de 'salesCount' ou 'onSale' se der erro de índice
        if (error.code === 'failed-precondition') {
            try {
                const fallbackQuery = query(collection(db, 'products'), limit(10));
                const fallbackData = await fetchCollection(fallbackQuery);
                setBestSellers(fallbackData);
                setSaleProducts(fallbackData);
                setRecommended(fallbackData);
            } catch (fallbackError) {
                console.error("Erro no fallback da Home: ", fallbackError);
            }
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