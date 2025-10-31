import React from 'react';
import { Link } from 'react-router-dom';
import styles from './PromoBanners.module.css';

// --- ATUALIZADO: Usando 'picsum.photos' (Rápido e Estável) ---
const bannersData = [
  {
    id: 1,
    type: 'large',
    imgUrl: 'https://picsum.photos/seed/promo-verao/800/450',
    alt: 'Promoção de Verão',
    link: '/loja?tag=verao',
  },
  {
    id: 2,
    type: 'small',
    imgUrl: 'https://picsum.photos/seed/promo-acessorios/400/450',
    alt: 'Novos Acessórios',
    link: '/loja?categoria=acessorios',
  },
  {
    id: 3,
    type: 'small',
    imgUrl: 'https://picsum.photos/seed/promo-masculino/400/450',
    alt: 'Linha Masculina',
    link: '/loja?categoria=masculino',
  },
  {
    id: 4,
    type: 'large',
    imgUrl: 'https://picsum.photos/seed/promo-casa/800/450',
    alt: 'Novidades para Casa',
    link: '/loja?categoria=casa',
  },
];

/**
 * Componente para exibir blocos de banners promocionais.
 * - Suporta layouts de 60%/30% e 30%/60% (desktop).
 * - Totalmente responsivo: no mobile, os banners ocupam 100% da largura.
 * - Utiliza imagens de placeholder rápidas (Picsum).
 * (Princípios: UI/UX de Excelência, Design Responsivo, Performance Total)
 */
const PromoBanners = () => {
  return (
    // O componente agora não tem seu próprio <section> ou <h2
    // Isso é controlado pela HomePage (Arquitetura Escalável)
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
  );
};

export default PromoBanners;