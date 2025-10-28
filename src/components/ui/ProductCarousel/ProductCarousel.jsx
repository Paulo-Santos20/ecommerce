import React from 'react';

// Importando o Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';

// Importando os estilos CSS do Swiper
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

// Importando nossos componentes e estilos
import ProductCard from '../ProductCard/ProductCard';
import styles from './ProductCarousel.module.css';

/**
 * Componente de Carrossel de Produtos (Refatorado - Dumb Component).
 * - Recebe 'products' via props (Arquitetura Escalável).
 * - É 100% reutilizável para "Mais Vendidos", "Ofertas", etc.
 */
const ProductCarousel = ({ products }) => {
  
  // Proteção para caso os produtos ainda não tenham carregado
  if (!products || products.length === 0) {
    // Em um app real, teríamos um <Loading /> aqui
    return <p className="container">Carregando produtos...</p>;
  }

  return (
    <div className={styles.carouselWrapper}>
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={20} // Espaço entre os cards
        navigation={true}  // Setas de navegação
        pagination={{ clickable: true, el: `.${styles.swiperPagination}` }}
        
        // --- Design Responsivo "Mobile-First" ---
        breakpoints={{
          // Mobile (base)
          320: { slidesPerView: 2.2, spaceBetween: 10 },
          // Tablet
          768: { slidesPerView: 3.5, spaceBetween: 15 },
          // Desktop (atende ao requisito "5 produtos por página")
          1024: { slidesPerView: 5, spaceBetween: 20 },
        }}
        className={`${styles.productSwiper} container`}
      >
        {products.map((product) => (
          <SwiperSlide key={product.id}>
            <ProductCard product={product} />
          </SwiperSlide>
        ))}
      </Swiper>
      
      {/* Container customizado para a paginação (bolinhas) */}
      <div className={`${styles.swiperPagination} container`}></div>
    </div>
  );
};

export default ProductCarousel;