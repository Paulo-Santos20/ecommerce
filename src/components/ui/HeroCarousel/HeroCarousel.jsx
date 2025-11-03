import React from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay, Pagination } from 'swiper/modules';
import { useSettings } from '../../../context/SettingsContext'; // 1. Importar
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import styles from './HeroCarousel.module.css';

/**
 * Componente de Carrossel de Banners (Hero).
 * ATUALIZADO: Agora busca as imagens do SettingsContext.
 */
const HeroCarousel = () => {
  // 2. Puxa os slides do Contexto
  const { settings } = useSettings();
  const bannerImages = settings.heroSlider || []; // Pega os slides ou um array vazio

  if (bannerImages.length === 0) {
    return null; // Não renderiza nada se não houver slides
  }

  return (
    <section className={styles.carouselSection}>
      <Swiper
        modules={[Navigation, Autoplay, Pagination]}
        loop={true}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
        }}
        navigation={true}
        pagination={{ clickable: true }}
        className={styles.heroSwiper}
      >
        {bannerImages.map((banner, index) => (
          // Usa 'index' como key caso o ID não seja único
          <SwiperSlide key={banner.id || index}> 
            <Link to={banner.link || '#'} className={styles.slideLink}>
              <picture>
                <source 
                  media="(min-width: 769px)" 
                  srcSet={banner.imgUrlDesktop} 
                />
                <img 
                  src={banner.imgUrlMobile} 
                  alt={banner.alt}
                  className={styles.slideImage}
                />
              </picture>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default HeroCarousel;