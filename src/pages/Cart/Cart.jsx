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
  
  // Seleciona os estados e ações do store individualmente
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  // --- CORREÇÃO DO BUG R$ NaN ---
  // A propriedade agora é 'price', não 'preco'.
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  // --------------------------------

  const handleCheckout = () => {
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

      <div className={styles.cartGrid}>
        {/* Lista de Itens */}
        <div className={styles.cartItems}>
          {items.map(item => (
            <div key={item.id} className={styles.cartItem}>
              <img src={item.imagem} alt={item.nome} className={styles.itemImage} />
              
              <div className={styles.itemInfo}>
                <h3 className={styles.itemName}>{item.nome}</h3>
                {/* Mostra variante se existir */}
                {(item.color || item.size) && (
                  <small className={styles.itemVariant}>{item.color} / {item.size}</small>
                )}
                <span className={styles.itemPrice}>{formatCurrency(item.price)}</span>
              </div>
              
              {/* Botões de Quantidade */}
              <div className={styles.itemQuantity}>
                <button 
                  onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                  className={styles.quantityBtn}
                  aria-label="Diminuir quantidade"
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button 
                  onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                  className={styles.quantityBtn}
                  aria-label="Aumentar quantidade"
                >
                  +
                </button>
              </div>
              
              {/* Total do Item */}
              <span className={styles.itemTotal}>
                {formatCurrency(item.price * item.quantity)}
              </span>
              
              <button 
                onClick={() => removeItem(item.id)} 
                className={styles.removeBtn}
                aria-label="Remover item"
              >
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