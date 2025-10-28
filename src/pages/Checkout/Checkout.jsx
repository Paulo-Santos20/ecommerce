import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { db } from '../../firebase/config';
import { collection, addDoc, serverTimestamp, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import styles from './Checkout.module.css';

// Esquema de validação do Endereço
const addressSchema = z.object({
  cep: z.string().min(8, "CEP inválido."),
  rua: z.string().min(3, "Rua obrigatória."),
  numero: z.string().min(1, "Número obrigatório."),
  complemento: z.string().optional(),
  bairro: z.string().min(3, "Bairro obrigatório."),
  cidade: z.string().min(3, "Cidade obrigatória."),
  estado: z.string().min(2, "Estado obrigatório (ex: PE)."),
});

const Checkout = () => {
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const navigate = useNavigate();

  // Hooks dos Stores
  const { items, clearCart } = useCartStore();
  const { user, isAuthReady } = useAuthStore();
  
  const subtotal = items.reduce((acc, item) => acc + item.preco * item.quantity, 0);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(addressSchema),
    // TODO: Buscar endereço salvo do 'user.endereco' do Firestore
  });

  // Simulação de "Finalizar Pedido"
  const handleOrderSubmit = async (data) => {
    setIsSubmittingOrder(true);
    setOrderError(null);

    // 1. Verificação de Segurança (Usuário e Carrinho)
    if (!user) {
      setOrderError("Você precisa estar logado para finalizar a compra.");
      setIsSubmittingOrder(false);
      navigate('/login');
      return;
    }
    if (items.length === 0) {
      setOrderError("Seu carrinho está vazio.");
      setIsSubmittingOrder(false);
      navigate('/loja');
      return;
    }
    
    // 2. Montar o objeto do Pedido
    const orderData = {
      userId: user.uid,
      itens: items, // Salva uma cópia dos itens do carrinho
      total: subtotal,
      status: "processando", // Status inicial
      enderecoEnvio: data, // Dados do formulário
      dataPedido: serverTimestamp(),
    };

    try {
      // 3. Salvar o Pedido na coleção 'orders'
      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      
      // 4. (Opcional) Salvar endereço no perfil do usuário
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        endereco: data,
        historicoPedidos: arrayUnion(orderRef.id) // Adiciona ID do pedido
      });
      
      // 5. Limpar o carrinho (Zustand)
      clearCart();
      
      // 6. Redirecionar para página de Sucesso
      // TODO: Criar página /pedido-sucesso/:orderId
      alert("Pedido realizado com sucesso!");
      navigate('/'); 

    } catch (error) {
      console.error("Erro ao criar pedido: ", error);
      setOrderError("Não foi possível processar seu pedido. Tente novamente.");
      setIsSubmittingOrder(false);
    }
  };
  
  // Proteção de Rota Simples
  if (isAuthReady && !user) {
    navigate('/login');
    return <p>Redirecionando para o login...</p>;
  }
  if (items.length === 0) {
    navigate('/loja');
    return <p>Seu carrinho está vazio. Redirecionando...</p>;
  }

  return (
    <div className={`container ${styles.checkoutPage}`}>
      <h1 className={styles.title}>Finalizar Compra</h1>
      
      <div className={styles.checkoutGrid}>
        {/* Coluna 1: Endereço e Pagamento */}
        <div className={styles.formColumn}>
          
          {/* Formulário de Endereço */}
          <section className={styles.formSection}>
            <h2>1. Endereço de Entrega</h2>
            <form onSubmit={handleSubmit(handleOrderSubmit)} id="checkout-form" className={styles.addressForm}>
              {/* CEP e Rua */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="cep">CEP</label>
                  <input id="cep" {...register("cep")} />
                  {errors.cep && <span className={styles.error}>{errors.cep.message}</span>}
                </div>
                <div className={styles.formGroup} style={{flex: 2}}>
                  <label htmlFor="rua">Rua</label>
                  <input id="rua" {...register("rua")} />
                  {errors.rua && <span className={styles.error}>{errors.rua.message}</span>}
                </div>
              </div>
              {/* Número e Complemento */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="numero">Número</label>
                  <input id="numero" {...register("numero")} />
                  {errors.numero && <span className={styles.error}>{errors.numero.message}</span>}
                </div>
                <div className={styles.formGroup} style={{flex: 2}}>
                  <label htmlFor="complemento">Complemento (Opcional)</label>
                  <input id="complemento" {...register("complemento")} />
                </div>
              </div>
              {/* Bairro, Cidade, Estado */}
              <div className={styles.formRow}>
                <div className={styles.formGroup} style={{flex: 2}}>
                  <label htmlFor="bairro">Bairro</label>
                  <input id="bairro" {...register("bairro")} />
                  {errors.bairro && <span className={styles.error}>{errors.bairro.message}</span>}
                </div>
                <div className={styles.formGroup} style={{flex: 2}}>
                  <label htmlFor="cidade">Cidade</label>
                  <input id="cidade" {...register("cidade")} />
                  {errors.cidade && <span className={styles.error}>{errors.cidade.message}</span>}
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="estado">UF</label>
                  <input id="estado" {...register("estado")} maxLength={2} />
                  {errors.estado && <span className={styles.error}>{errors.estado.message}</span>}
                </div>
              </div>
            </form>
          </section>

          {/* Simulação de Pagamento */}
          <section className={styles.formSection}>
            <h2>2. Pagamento</h2>
            <div className={styles.paymentSimulation}>
              <p>Simulação de Pagamento.</p>
              <p>Clique em "Finalizar Pedido" para confirmar os dados e salvar o pedido no banco de dados.</p>
            </div>
          </section>
        </div>

        {/* Coluna 2: Resumo do Pedido */}
        <div className={styles.summaryColumn}>
          <div className={styles.orderSummary}>
            <h2>Resumo do Pedido</h2>
            {items.map(item => (
              <div key={item.id} className={styles.summaryItem}>
                <span>{item.quantity}x {item.nome}</span>
                <span>{formatCurrency(item.preco * item.quantity)}</span>
              </div>
            ))}
            <div className={`${styles.summaryRow} ${styles.total}`}>
              <strong>Total</strong>
              <strong>{formatCurrency(subtotal)}</strong>
            </div>
            
            {orderError && <span className={styles.error}>{orderError}</span>}
            
            <button 
              type="submit" 
              form="checkout-form" 
              className={styles.ctaButton}
              disabled={isSubmittingOrder}
            >
              {isSubmittingOrder ? "Processando..." : "Finalizar Pedido"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;