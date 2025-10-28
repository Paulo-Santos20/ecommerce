import React from 'react';
import { Link } from 'react-router-dom';
import styles from './ProductCard.module.css';

/**
 * Formata um número como moeda BRL (Reais).
 */
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Card de Produto Reutilizável.
 * Exibe a imagem principal, nome e preços.
 * Leva para a página de detalhes do produto ao clicar.
 * (UI/UX de Excelência)
 */
const ProductCard = ({ product }) => {
  const { id, nome, preco, precoAnterior, imagens } = product;

  // Usa a primeira imagem ou uma imagem padrão
  const imageUrl = imagens && imagens.length > 0
    ? imagens[0]
    : 'https://via.placeholder.com/300x300.png?text=Fina+Estampa';

  return (
    <Link to={`/produto/${id}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        <img src={imageUrl} alt={nome} className={styles.image} />
      </div>
      <div className={styles.info}>
        <h3 className={styles.name}>{nome}</h3>
        <div className={styles.priceContainer}>
          {precoAnterior && (
            <span className={styles.oldPrice}>
              {formatCurrency(precoAnterior)}
            </span>
          )}
          <span className={styles.price}>{formatCurrency(preco)}</span>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;