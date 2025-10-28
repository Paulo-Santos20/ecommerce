import React from 'react';
import { Link } from 'react-router-dom';

// Importando o Swiper (Core e Módulos)
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay, Pagination } from 'swiper/modules';

// Importando os estilos CSS do Swiper
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Importando nossos estilos CSS Modules
import styles from './HeroCarousel.module.css';

// --- ATUALIZADO: Usando imagens reais do Unsplash ---
const bannerImages = [
  {
    id: 1,
    imgUrlMobile: 'https://source.unsplash.com/800x600/?fashion,sale&sig=1',
    imgUrlDesktop: 'https://source.unsplash.com/1600x400/?fashion,sale&sig=2',
    alt: 'Banner da Promoção 1',
    link: '/loja?categoria=ofertas',
  },
  {
    id: 2,
    imgUrlMobile: 'https://source.unsplash.com/800x600/?new,style,clothing&sig=3',
    imgUrlDesktop: 'https://source.unsplash.com/1600x400/?new,style,clothing&sig=4',
    alt: 'Banner da Promoção 2',
    link: '/loja?categoria=novidades',
  },
  {
    id: 3,
    imgUrlMobile: 'https://source.unsplash.com/800x600/?womens-fashion,model&sig=5',
    imgUrlDesktop: 'https://source.unsplash.com/1600x400/?womens-fashion,model&sig=6',
    alt: 'Banner da Promoção 3',
    link: '/loja?categoria=feminino',
  },
];

/**
 * Componente de Carrossel de Banners (Hero).
 * - Usa Swiper.js para funcionalidade robusta.
 * - Inclui Autoplay, Navegação (setas) e Paginação (dots).
 * - "Infinito" (loop = true).
 * - Carrega imagens diferentes para Mobile e Desktop (Performance Total).
 */
const HeroCarousel = () => {
  return (
    <section className={styles.carouselSection}>
      <Swiper
        // Módulos que vamos usar
        modules={[Navigation, Autoplay, Pagination]}
        
        // --- Requisitos ---
        loop={true}           // Banner infinito
        autoplay={{
          delay: 4000,        // Gira automaticamente a cada 4 segundos
          disableOnInteraction: false, // Não para o autoplay ao clicar
        }}
        navigation={true}     // Setas de navegação
        
        // --- UI/UX Adicional ---
        pagination={{ clickable: true }} // Bolinhas de navegação
        
        // Classe principal para customização
        className={styles.heroSwiper}
      >
        {bannerImages.map((banner) => (
          <SwiperSlide key={banner.id}>
            <Link to={banner.link} className={styles.slideLink}>
              {/* Técnica de Design Responsivo:
                Usamos <picture> para carregar a imagem correta 
                para o dispositivo do usuário (Mobile-First).
              */}
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