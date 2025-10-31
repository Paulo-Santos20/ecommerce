import React from 'react';
import { Link } from 'react-router-dom';

// Importando o Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';

// Importando os estilos CSS do Swiper
import 'swiper/css';
import 'swiper/css/free-mode';

// Importando nossos estilos CSS Modules
import styles from './CategoryBubbles.module.css';

// --- ATUALIZADO: Usando 'picsum.photos' (Rápido e Estável) ---
// Adicionamos 'seed' para garantir que cada categoria tenha uma imagem consistente
const categories = [
  { id: 1, name: 'Feminino', imgUrl: 'https://picsum.photos/seed/feminino/150/150', link: '/loja?categoria=feminino' },
  { id: 2, name: 'Masculino', imgUrl: 'https://picsum.photos/seed/masculino/150/150', link: '/loja?categoria=masculino' },
  { id: 3, name: 'Infantil', imgUrl: 'https://picsum.photos/seed/infantil/150/150', link: '/loja?categoria=infantil' },
  { id: 4, name: 'Calçados', imgUrl: 'https://picsum.photos/seed/calcados/150/150', link: '/loja?categoria=calcados' },
  { id: 5, name: 'Casa', imgUrl: 'https://picsum.photos/seed/casa/150/150', link: '/loja?categoria=casa' },
  { id: 6, name: 'Acessórios', imgUrl: 'https://picsum.photos/seed/acessorios/150/150', link: '/loja?categoria=acessorios' },
  { id: 7, name: 'Beleza', imgUrl: 'https://picsum.photos/seed/beleza/150/150', link: '/loja?categoria=beleza' },
  { id: 8, name: 'Novidades', imgUrl: 'https://picsum.photos/seed/novidades/150/150', link: '/loja?categoria=novidades' },
  { id: 9, name: 'Ofertas', imgUrl: 'https://picsum.photos/seed/ofertas/150/150', link: '/loja?categoria=ofertas' },
];

/**
 * Componente de Categorias em "Bolas".
 * - Inspirado no design da Marisa.
 * - Mobile-First: É um carrossel horizontal (Swiper) em telas pequenas.
 * - Desktop: Exibe todas as 9 categorias em grade.
 */
const CategoryBubbles = () => {
  return (
    <section className={`container ${styles.categorySection}`}>
      <h2 className={styles.title}>Navegue por Categorias</h2>
      
      <Swiper
        modules={[FreeMode]}
        slidesPerView={'auto'} // Chave para o layout responsivo
        spaceBetween={16}     // Espaço entre as bolhas
        freeMode={true}       // Permite "arrastar" livremente
        
        // Configuração de breakpoints (Responsividade)
        breakpoints={{
          // Mobile (base): 'auto' + spaceBetween
          
          // Tablet
          768: {
            slidesPerView: 7,
            spaceBetween: 20,
          },
          // Desktop (mostra todas as 9)
          992: {
            slidesPerView: 9,
            spaceBetween: 24,
            freeMode: false, // Trava o scroll no desktop
          },
        }}
        className={styles.categorySwiper}
      >
        {categories.map((category) => (
          <SwiperSlide key={category.id} className={styles.categorySlide}>
            <Link to={category.link} className={styles.bubbleLink}>
              <div className={styles.imageWrapper}>
                <img 
                  src={category.imgUrl} 
                  alt={category.name}
                  className={styles.bubbleImage}
                />
              </div>
              <p className={styles.categoryName}>{category.name}</p>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default CategoryBubbles;