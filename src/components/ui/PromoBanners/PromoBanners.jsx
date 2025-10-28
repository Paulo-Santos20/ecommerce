import React from 'react';
import { Link } from 'react-router-dom';
import styles from './PromoBanners.module.css';

// --- ATUALIZADO: Usando imagens reais do Unsplash ---
const bannersData = [
  {
    id: 1,
    type: 'large', // Ocupa a maior parte no layout 60/30
    imgUrl: 'https://source.unsplash.com/800x450/?fashion,summer,sale&sig=a',
    alt: 'Promoção de Verão',
    link: '/loja?tag=verao',
  },
  {
    id: 2,
    type: 'small', // Ocupa a menor parte no layout 60/30
    imgUrl: 'https://source.unsplash.com/400x450/?accessories,jewelry&sig=b',
    alt: 'Novos Acessórios',
    link: '/loja?categoria=acessorios',
  },
  {
    id: 3,
    type: 'small', // Ocupa a menor parte no layout 30/60
    imgUrl: 'https://source.unsplash.com/400x450/?mens,wear,shoes&sig=c',
    alt: 'Linha Masculina',
    link: '/loja?categoria=masculino',
  },
  {
    id: 4,
    type: 'large', // Ocupa a maior parte no layout 30/60
    imgUrl: 'https://source.unsplash.com/800x450/?home,decor,kitchen&sig=d',
    alt: 'Novidades para Casa',
    link: '/loja?categoria=casa',
  },
];

/**
 * Componente para exibir blocos de banners promocionais.
 * - Suporta layouts de 60%/30% e 30%/60% (desktop).
 * - Totalmente responsivo: no mobile, os banners ocupam 100% da largura.
 * - Utiliza imagens reais do Unsplash.
 * (Princípios: UI/UX de Excelência, Design Responsivo, Performance Total)
 */
const PromoBanners = () => {
  return (
    <section className={`container ${styles.promoBannersSection}`}>
      <h2 className={styles.sectionTitle}>Conheça Nossas Ofertas</h2>
      
      <div className={styles.bannerGrid}>
        {/* Bloco 1: 60% e 30% */}
        <div className={styles.bannerRow}>
          <Link 
            to={bannersData[0].link} 
            className={`${styles.promoBanner} ${styles.banner60}`}
          >
            <img src={bannersData[0].imgUrl} alt={bannersData[0].alt} className={styles.bannerImage} />
            <div className={styles.bannerOverlay}>
              <h3>{bannersData[0].alt}</h3>
              <p>Confira agora!</p>
            </div>
          </Link>
          <Link 
            to={bannersData[1].link} 
            className={`${styles.promoBanner} ${styles.banner30}`}
          >
            <img src={bannersData[1].imgUrl} alt={bannersData[1].alt} className={styles.bannerImage} />
            <div className={styles.bannerOverlay}>
              <h3>{bannersData[1].alt}</h3>
              <p>Explore!</p>
            </div>
          </Link>
        </div>

        {/* Bloco 2: 30% e 60% */}
        <div className={styles.bannerRow}>
          <Link 
            to={bannersData[2].link} 
            className={`${styles.promoBanner} ${styles.banner30}`}
          >
            <img src={bannersData[2].imgUrl} alt={bannersData[2].alt} className={styles.bannerImage} />
            <div className={styles.bannerOverlay}>
              <h3>{bannersData[2].alt}</h3>
              <p>Descubra!</p>
            </div>
          </Link>
          <Link 
            to={bannersData[3].link} 
            className={`${styles.promoBanner} ${styles.banner60}`}
          >
            <img src={bannersData[3].imgUrl} alt={bannersData[3].alt} className={styles.bannerImage} />
            <div className={styles.bannerOverlay}>
              <h3>{bannersData[3].alt}</h3>
              <p>Veja mais!</p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PromoBanners;