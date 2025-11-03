import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../../../context/SettingsContext'; // 1. Importa o hook
import styles from './PromoBanners.module.css';

const PromoBanners = () => {
  // 2. Puxa os banners do Contexto
  const { settings } = useSettings();
  const banners = settings.homeBanners;

  // Se os banners ainda não carregaram ou estão vazios, não renderiza
  if (!banners) return null; 

  return (
    <div className={styles.bannerGrid}>
      {/* Bloco 1: 60% e 30% */}
      <div className={styles.bannerRow}>
        {banners.banner1_large && (
          <Link to={banners.banner1_large.link} className={`${styles.promoBanner} ${styles.banner60}`}>
            <img src={banners.banner1_large.imgUrl} alt={banners.banner1_large.alt} className={styles.bannerImage} />
            <div className={styles.bannerOverlay}><h3>{banners.banner1_large.alt}</h3><p>Confira agora!</p></div>
          </Link>
        )}
        {banners.banner2_small && (
          <Link to={banners.banner2_small.link} className={`${styles.promoBanner} ${styles.banner30}`}>
            <img src={banners.banner2_small.imgUrl} alt={banners.banner2_small.alt} className={styles.bannerImage} />
            <div className={styles.bannerOverlay}><h3>{banners.banner2_small.alt}</h3><p>Explore!</p></div>
          </Link>
        )}
      </div>

      {/* Bloco 2: 30% e 60% */}
      <div className={styles.bannerRow}>
        {banners.banner3_small && (
          <Link to={banners.banner3_small.link} className={`${styles.promoBanner} ${styles.banner30}`}>
            <img src={banners.banner3_small.imgUrl} alt={banners.banner3_small.alt} className={styles.bannerImage} />
            <div className={styles.bannerOverlay}><h3>{banners.banner3_small.alt}</h3><p>Descubra!</p></div>
          </Link>
        )}
        {banners.banner4_large && (
          <Link to={banners.banner4_large.link} className={`${styles.promoBanner} ${styles.banner60}`}>
            <img src={banners.banner4_large.imgUrl} alt={banners.banner4_large.alt} className={styles.bannerImage} />
            <div className={styles.bannerOverlay}><h3>{banners.banner4_large.alt}</h3><p>Veja mais!</p></div>
          </Link>
        )}
      </div>
    </div>
  );
};

export default PromoBanners;