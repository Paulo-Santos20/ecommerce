import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/useCartStore';
import { FaTrash } from 'react-icons/fa';
import styles from './Cart.module.css';

// Helper de formatação de moeda
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const Cart = () => {
  const navigate = useNavigate();
  // Seletores do Zustand (Performance: só re-renderiza se estas partes mudarem)
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  // Calcula o total
  const subtotal = items.reduce((acc, item) => acc + item.preco * item.quantity, 0);

  const handleCheckout = () => {
    // TODO: Adicionar verificação de login (useAuthStore)
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className={`container ${styles.emptyCart}`}>
        <h1>Seu carrinho está vazio</h1>
        <p>Que tal adicionar alguns produtos?</p>
        <Link to="/loja" className={styles.ctaButton}>
          Ir para a Loja
        </Link>
      </div>
    );
  }

  return (
    <div className={`container ${styles.cartPage}`}>
      <h1 className={styles.title}>Meu Carrinho</h1>

      {/* Layout de Grid (Mobile-First otimizado) */}
      <div className={styles.cartGrid}>
        {/* Lista de Itens */}
        <div className={styles.cartItems}>
          {items.map(item => (
            <div key={item.id} className={styles.cartItem}>
              <img src={item.imagem} alt={item.nome} className={styles.itemImage} />
              
              <div className={styles.itemInfo}>
                <h3 className={styles.itemName}>{item.nome}</h3>
                <span className={styles.itemPrice}>{formatCurrency(item.preco)}</span>
              </div>
              
              <div className={styles.itemQuantity}>
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className={styles.quantityBtn}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className={styles.quantityBtn}>+</button>
              </div>
              
              <span className={styles.itemTotal}>
                {formatCurrency(item.preco * item.quantity)}
              </span>
              
              <button onClick={() => removeItem(item.id)} className={styles.removeBtn}>
                <FaTrash />
              </button>
            </div>
          ))}
        </div>

        {/* Resumo do Pedido */}
        <div className={styles.orderSummary}>
          <h2>Resumo</h2>
          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Frete</span>
            <span>Grátis</span>
          </div>
          <div className={`${styles.summaryRow} ${styles.total}`}>
            <strong>Total</strong>
            <strong>{formatCurrency(subtotal)}</strong>
          </div>
          <button onClick={handleCheckout} className={styles.ctaButton}>
            Finalizar Compra
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;