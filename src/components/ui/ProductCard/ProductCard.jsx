import React from 'react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../../../store/useCartStore'; // Verifique o caminho
import { FaShoppingCart } from 'react-icons/fa'; 
import { toast } from 'react-toastify'; // Importa o toast
import CountdownTimer from '../CountdownTimer/CountdownTimer'; // Verifique o caminho
import styles from './ProductCard.module.css';

const formatCurrency = (value) => {
  if (typeof value !== 'number' || isNaN(value)) {
    return 'R$ --,--';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const isSaleActive = (product) => {
  if (!product?.onSale) return false;
  if (product.onSale && !product.offerEndDate) return true; // Promo permanente
  // Garante que é um Timestamp antes de chamar toDate()
  return product.offerEndDate && typeof product.offerEndDate.toDate === 'function'
         ? product.offerEndDate.toDate() > new Date()
         : false;
};

const getCheapestVariant = (variants) => {
  if (!variants || variants.length === 0) {
    return null;
  }
  return variants.reduce(
    (min, v) => (v.price < min.price ? v : min),
    variants[0]
  );
};

/**
 * Card de Produto (Atualizado)
 * - Usa toast() para feedback ao adicionar ao carrinho.
 */
const ProductCard = ({ product }) => {
  const { id, nome, images, mainImageIndex, variants, offerEndDate } = product;
  const addItemToCart = useCartStore((state) => state.addItem);

  const saleIsActive = isSaleActive(product);
  const showCountdown = saleIsActive && offerEndDate != null;

  const imageUrl = images && images.length > 0
    ? images[mainImageIndex || 0]
    : 'https://via.placeholder.com/400x400.png?text=Fina+Estampa';

  const cheapestVariant = getCheapestVariant(variants);
  const displayPrice = cheapestVariant ? cheapestVariant.price : 0;
  const displayOldPrice = saleIsActive && cheapestVariant && cheapestVariant.oldPrice > cheapestVariant.price
    ? cheapestVariant.oldPrice
    : null;
  const showFromPrice = variants?.length > 1;

  const handleAddToCart = (e) => {
    e.preventDefault(); 
    e.stopPropagation(); 

    if (cheapestVariant && cheapestVariant.stock > 0) {
      const cartItemId = `${id}-${cheapestVariant.color}-${cheapestVariant.size}`;
      const itemToAdd = {
        id: cartItemId,
        productId: id,
        nome: nome,
        imagem: imageUrl, 
        price: cheapestVariant.price,
        color: cheapestVariant.color,
        size: cheapestVariant.size,
        quantity: 1
      };
      addItemToCart(itemToAdd, 1);
      
      // --- USA TOAST ---
      toast.success(`${nome} adicionado ao carrinho!`); 
    } else {
      toast.error("Produto ou variante indisponível no momento.");
    }
  };

  return (
    <Link to={`/produto/${id}`} className={styles.card}>
      
      <div className={styles.tagWrapper}>
        {saleIsActive && ( <div className={styles.saleTag}>PROMOÇÃO</div> )}
        {showCountdown && (
          <div className={styles.countdownWrapper}>
            <CountdownTimer expiryDate={offerEndDate.toDate()} />
          </div>
        )}
      </div>
      
      <div className={styles.imageWrapper}>
        <img src={imageUrl} alt={nome} className={styles.image} />
      </div>
      
      <div className={styles.info}>
        <h3 className={styles.name}>{nome}</h3>
        <div className={styles.priceContainer}>
          {displayOldPrice && (
            <span className={styles.oldPrice}>{formatCurrency(displayOldPrice)}</span>
          )}
          <span className={styles.price}>
            {showFromPrice && !displayOldPrice ? 'A partir de ' : ''}
            {formatCurrency(displayPrice)}
          </span>
        </div>
      </div>

      <button 
        className={styles.addToCartBtn} 
        onClick={handleAddToCart}
        disabled={!cheapestVariant || cheapestVariant.stock === 0} 
        aria-label={`Adicionar ${nome} ao carrinho`}
      >
        <FaShoppingCart />
      </button>
    </Link>
  );
};

export default ProductCard;