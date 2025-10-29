import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { db } from '../../firebase/config';
import { collection, addDoc, doc, getDoc, setDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { toast } from 'react-toastify';
import Loading from '../../components/ui/Loading/Loading';
import { FaSpinner } from 'react-icons/fa'; // Importa o spinner
import styles from './Checkout.module.css';

// Esquema de validação do Endereço (Zod)
const addressSchema = z.object({
  cep: z.string().min(8, "CEP inválido. Use 8 números.").max(9, "CEP inválido."),
  rua: z.string().min(3, "Rua é obrigatória."),
  numero: z.string().min(1, "Número é obrigatório."),
  complemento: z.string().optional(),
  bairro: z.string().min(3, "Bairro é obrigatório."),
  cidade: z.string().min(3, "Cidade é obrigatória."),
  estado: z.string().min(2, "UF é obrigatória (ex: PE).").max(2, "Use apenas a sigla (ex: PE)."),
});

// Helper de formatação de moeda
const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const Checkout = () => {
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [isCepLoading, setIsCepLoading] = useState(false); // 1. Estado para o loading do CEP
  const [formError, setFormError] = useState(null);
  const navigate = useNavigate();

  // --- Hooks dos Stores ---
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const user = useAuthStore((state) => state.user);
  
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
        cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: ''
    }
  });

  // --- REQUISITO: Autocomplete do CEP ---
  const cepValue = watch('cep'); // "Assiste" ao valor do campo CEP

  useEffect(() => {
    // 2. Função para buscar o CEP na API
    const fetchCepData = async (cep) => {
      setIsCepLoading(true);
      try {
        const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`);
        if (!response.ok) throw new Error("CEP não encontrado.");
        
        const data = await response.json();
        
        // 3. Preenche os campos do formulário (UI/UX de Excelência)
        setValue('rua', data.street || '', { shouldValidate: true });
        setValue('bairro', data.neighborhood || '', { shouldValidate: true });
        setValue('cidade', data.city || '', { shouldValidate: true });
        setValue('estado', data.state || '', { shouldValidate: true });

      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        // Não define um erro de formulário, apenas falha em preencher
      } finally {
        setIsCepLoading(false);
      }
    };

    const cepLimpo = cepValue?.replace(/\D/g, ''); // Remove máscara (ex: '55611-010')
    if (cepLimpo && cepLimpo.length === 8) {
      fetchCepData(cepLimpo);
    }
  }, [cepValue, setValue]); // Roda sempre que o 'cepValue' mudar

  // --- Busca Endereço Salvo ---
  useEffect(() => {
    if (user) {
      const fetchUserAddress = async () => {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists() && userSnap.data().endereco) {
          // Preenche o formulário se o CEP ainda não foi preenchido
          if (!watch('cep')) { 
            reset(userSnap.data().endereco);
          }
        }
      };
      fetchUserAddress();
    }
  }, [user, reset, watch]);

  // --- Submissão do Pedido ---
  const handleOrderSubmit = async (data) => {
    setIsSubmittingOrder(true);
    setFormError(null);

    const orderData = {
      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName,
      itens: items, 
      total: subtotal,
      status: "processando", // Status inicial que o Admin irá aprovar
      enderecoEnvio: data, 
      dataPedido: serverTimestamp(),
    };

    try {
      const orderCollectionRef = collection(db, 'orders');
      const orderRef = await addDoc(orderCollectionRef, orderData);
      
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { 
          endereco: data, 
          historicoPedidos: arrayUnion(orderRef.id)
        }, 
        { merge: true } 
      );
      
      clearCart();
      
      // 4. REQUISITO: Redireciona para a página de "Meus Pedidos" do cliente
      toast.success("Pedido realizado com sucesso!");
      navigate('/meus-pedidos'); 

    } catch (error) {
      console.error("Erro ao criar pedido: ", error);
      setFormError("Não foi possível processar seu pedido. Tente novamente.");
      toast.error("Ops! Algo deu errado ao finalizar o pedido.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };
  
  // --- Guardas de Roteamento ---
  if (!user) {
    navigate('/login?redirect=/checkout'); 
    return <Loading />; 
  }
  if (items.length === 0 && !isSubmittingOrder) { // Evita redirecionar durante a submissão
    navigate('/loja'); 
    return <Loading />; 
  }

  return (
    <div className={`container ${styles.checkoutPage}`}>
      <h1 className={styles.title}>Finalizar Compra</h1>
      
      <div className={styles.checkoutGrid}>
        
        {/* Coluna 1: Formulário */}
        <div className={styles.formColumn}>
          <form onSubmit={handleSubmit(handleOrderSubmit)} id="checkout-form">
            
            {/* Seção de Endereço */}
            <section className={styles.formSection}>
              <h2>1. Endereço de Entrega</h2>
              <div className={styles.addressForm}>
                {/* CEP */}
                <div className={styles.formGroup}>
                  <label htmlFor="cep">CEP</label>
                  <div className={styles.cepInputWrapper}>
                    <input 
                      id="cep" 
                      {...register("cep")} 
                      maxLength={9}
                      onChange={(e) => { // Formatação de máscara do CEP
                        const formattedCep = e.target.value
                            .replace(/\D/g, '')
                            .replace(/^(\d{5})(\d)/, '$1-$2');
                        setValue('cep', formattedCep, { shouldValidate: true });
                      }}
                    />
                    {isCepLoading && <FaSpinner className={styles.cepSpinner} />}
                  </div>
                  {errors.cep && <span className={styles.error}>{errors.cep.message}</span>}
                </div>
                {/* Rua e Número */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup} style={{flex: 3}}>
                    <label htmlFor="rua">Rua / Av.</label>
                    <input id="rua" {...register("rua")} />
                    {errors.rua && <span className={styles.error}>{errors.rua.message}</span>}
                  </div>
                  <div className={styles.formGroup} style={{flex: 1}}>
                    <label htmlFor="numero">Número</label>
                    <input id="numero" {...register("numero")} />
                    {errors.numero && <span className={styles.error}>{errors.numero.message}</span>}
                  </div>
                </div>
                {/* Complemento e Bairro */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup} style={{flex: 1}}>
                    <label htmlFor="complemento">Complemento (Opcional)</label>
                    <input id="complemento" {...register("complemento")} />
                  </div>
                  <div className={styles.formGroup} style={{flex: 2}}>
                    <label htmlFor="bairro">Bairro</label>
                    <input id="bairro" {...register("bairro")} />
                    {errors.bairro && <span className={styles.error}>{errors.bairro.message}</span>}
                  </div>
                </div>
                {/* Cidade e Estado */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup} style={{flex: 3}}>
                    <label htmlFor="cidade">Cidade</label>
                    <input id="cidade" {...register("cidade")} />
                    {errors.cidade && <span className={styles.error}>{errors.cidade.message}</span>}
                  </div>
                  <div className={styles.formGroup} style={{flex: 1}}>
                    <label htmlFor="estado">UF</label>
                    <input id="estado" {...register("estado")} maxLength={2} />
                    {errors.estado && <span className={styles.error}>{errors.estado.message}</span>}
                  </div>
                </div>
              </div>
            </section>

            {/* Seção de Pagamento (Texto Atualizado) */}
            <section className={styles.formSection}>
              <h2>2. Pagamento</h2>
              {/* --- REQUISITO: Texto de Aprovação --- */}
              <div className={styles.paymentSimulation}>
                <p>Seu pedido será processado e está sujeito à aprovação de estoque e disponibilidade. Você será notificado sobre o status do seu pedido.</p>
                <p>Ao clicar em "Finalizar Pedido", você confirma os dados e autoriza o processamento.</p>
              </div>
            </section>
          </form>
        </div>

        {/* Coluna 2: Resumo do Pedido */}
        <div className={styles.summaryColumn}>
          <div className={styles.orderSummary}>
            <h2>Resumo do Pedido</h2>
            <div className={styles.summaryItems}>
              {items.map(item => (
                <div key={item.id} className={styles.summaryItem}>
                  <img src={item.imagem} alt={item.nome} className={styles.itemImage} />
                  <div className={styles.itemInfo}>
                    <p>{item.nome}</p>
                    <small>{item.color} / {item.size}</small>
                  </div>
                  <span className={styles.itemPrice}>
                    {item.quantity}x {formatCurrency(item.price)}
                  </span>
                </div>
              ))}
            </div>
            
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
            
            {formError && <span className={styles.error}>{formError}</span>}
            
            <button 
              type="submit" 
              form="checkout-form" 
              className={styles.ctaButton}
              disabled={isSubmittingOrder || isCepLoading} // Desabilita se estiver carregando CEP
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