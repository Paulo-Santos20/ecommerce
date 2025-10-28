import React from 'react';
import ProductCard from '../ProductCard/ProductCard';
import styles from './FeaturedProductGrid.module.css';

/**
 * Componente de Grade de Produtos (Estático).
 * - Recebe 'products' via props.
 * - Usado para seções de "vitrine" maiores, como "Para Você".
 * - Responsivo: 2 colunas (mobile) -> 3 (tablet) -> 5 (desktop).
 * (Princípios: UI/UX, Design Responsivo)
 */
const FeaturedProductGrid = ({ products }) => {
  if (!products || products.length === 0) {
    // Em um app real, teríamos um <Loading />
    return <p className="container">Carregando produtos...</p>;
  }

  return (
    <div className={`${styles.productGrid} container`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default FeaturedProductGrid;