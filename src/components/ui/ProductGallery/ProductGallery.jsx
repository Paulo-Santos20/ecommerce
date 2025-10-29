import React, { useState, useEffect } from 'react';

// Importando o Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Thumbs } from 'swiper/modules';

// Importando os estilos CSS do Swiper
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/thumbs'; // Para a galeria de miniaturas

// Importando nossos estilos CSS Modules
import styles from './ProductGallery.module.css';

/**
 * Componente de Galeria de Imagens do Produto.
 * - Mobile-First: Renderiza um Swiper com paginação (bolinhas).
 * - Desktop: Renderiza um Swiper principal com um Swiper de miniaturas (thumbnails)
 * controlando-o, seguindo o padrão de e-commerces modernos.
 * (Princípios: UI/UX de Excelência, Design Responsivo, Performance Total)
 */
const ProductGallery = ({ images = [], productName = 'Produto' }) => {
  // Estado para sincronizar os Swipers (principal e miniaturas)
  const [thumbsSwiper, setThumbsSwiper] = useState(null);

  if (!images || images.length === 0) {
    // Fallback para caso não haja imagens
    images = ['https://source.unsplash.com/600x600/?clothing,placeholder&sig=0'];
  }

  return (
    <div className={styles.galleryContainer}>
      {/* Swiper Principal (Imagem Grande) */}
      <Swiper
        modules={[Pagination, Thumbs]}
        spaceBetween={10}
        grabCursor={true}
        // Conecta este Swiper com o Swiper de miniaturas
        thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
        // Paginação de "bolinhas" (ótimo para mobile)
        pagination={{
          clickable: true,
          el: `.${styles.swiperPagination}`, // Alvo customizado
        }}
        className={styles.mainSwiper}
      >
        {images.map((imgUrl, index) => (
          <SwiperSlide key={index}>
            <img 
              src={imgUrl} 
              alt={`${productName} - Imagem ${index + 1}`} 
              className={styles.mainImage} 
            />
          </SwiperSlide>
        ))}
      </Swiper>
      
      {/* Div customizada para a paginação (bolinhas) */}
      <div className={`${styles.swiperPagination} ${styles.paginationMobile}`}></div>

      {/* Swiper de Miniaturas (Thumbnails) - Otimizado para Desktop */}
      <Swiper
        // Conecta este Swiper ao estado 'thumbsSwiper'
        onSwiper={setThumbsSwiper}
        modules={[Thumbs]}
        spaceBetween={10}
        slidesPerView={5} // Mostra 5 miniaturas de vez
        watchSlidesProgress={true}
        className={styles.thumbsSwiper}
      >
        {images.map((imgUrl, index) => (
          <SwiperSlide key={index} className={styles.thumbSlide}>
            <img 
              src={imgUrl} 
              alt={`Miniatura ${index + 1}`} 
              className={styles.thumbImage} 
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default ProductGallery;