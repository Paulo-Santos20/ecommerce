import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCartStore } from '../../store/useCartStore'; // <-- ESTA LINHA ESTAVA FALTANDO
import { useAuthStore } from '../../store/useAuthStore';
import { db } from '../../firebase/config';
import { collection, addDoc, doc, getDoc, setDoc, serverTimestamp, arrayUnion, query, where, onSnapshot, getDocs, limit } from 'firebase/firestore';
import { toast } from 'react-toastify';
import Loading from '../../components/ui/Loading/Loading';
import { FaSpinner, FaTag, FaCheckCircle, FaRegCircle } from 'react-icons/fa';
import styles from './Checkout.module.css';

// Esquema de validação do Endereço
const addressSchema = z.object({
  apelido: z.string().min(3, "Dê um apelido (ex: Casa, Trabalho)."),
  cep: z.string().min(8, "CEP inválido. Use 8 números.").max(9, "CEP inválido."),
  rua: z.string().min(3, "Rua é obrigatória."),
  numero: z.string().min(1, "Número é obrigatório."),
  complemento: z.string().optional(),
  bairro: z.string().min(3, "Bairro é obrigatório."),
  cidade: z.string().min(3, "Cidade é obrigatória."),
  estado: z.string().min(2, "UF é obrigatória (ex: PE).").max(2, "Use apenas a sigla (ex: PE)."),
});

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const Checkout = () => {
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
    const [formError, setFormError] = useState(null);
    const navigate = useNavigate();

    // --- Stores e Dados ---
    // (Corrigido para evitar loops de renderização)
    const items = useCartStore((state) => state.items);
    const clearCart = useCartStore((state) => state.clearCart);
    const user = useAuthStore((state) => state.user);
    const isAuthReady = useAuthStore((state) => state.isAuthReady);
    
    // --- Estados do Cupom ---
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState(null);
    const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);
    
    // --- Lógica de Preço ---
    const subtotal = useMemo(() => 
        items.reduce((acc, item) => acc + item.price * item.quantity, 0), 
    [items]);
    
    const discount = useMemo(() => {
        if (!appliedCoupon) return 0;
        if (appliedCoupon.type === 'fixed') {
            return Math.min(appliedCoupon.value, subtotal);
        }
        if (appliedCoupon.type === 'percent') {
            return (subtotal * (appliedCoupon.value / 100));
        }
        return 0;
    }, [appliedCoupon, subtotal]);

    const finalTotal = useMemo(() => subtotal - discount, [subtotal, discount]);
    
    // --- Lógica de Endereço ---
    const [addresses, setAddresses] = useState([]);
    const [loadingAddresses, setLoadingAddresses] = useState(true);
    const [selectedAddressId, setSelectedAddressId] = useState(null); 
    const [showNewAddressForm, setShowNewAddressForm] = useState(false);
    const [isCepLoading, setIsCepLoading] = useState(false);
    
    // Hook para o formulário de NOVO endereço
    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(addressSchema),
        defaultValues: { apelido: '', cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' }
    });

    // Autocomplete do CEP
    const cepValue = watch('cep');
    useEffect(() => {
        const fetchCepData = async (cep) => {
            setIsCepLoading(true);
            try {
                const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`);
                if (!response.ok) throw new Error("CEP não encontrado.");
                const data = await response.json();
                setValue('rua', data.street || '', { shouldValidate: true });
                setValue('bairro', data.neighborhood || '', { shouldValidate: true });
                setValue('cidade', data.city || '', { shouldValidate: true });
                setValue('estado', data.state || '', { shouldValidate: true });
            } catch (error) { console.error("Erro ao buscar CEP:", error); } 
            finally { setIsCepLoading(false); }
        };
        const cepLimpo = cepValue?.replace(/\D/g, '');
        if (cepLimpo && cepLimpo.length === 8) {
            fetchCepData(cepLimpo);
        }
    }, [cepValue, setValue]);

    // Guarda de Roteamento
    useEffect(() => {
        if (!isAuthReady) return; 
        if (!user) {
            toast.warn("Você precisa estar logado para finalizar a compra.");
            navigate('/login?redirect=/checkout');
        }
        if (items.length === 0 && !isSubmittingOrder) {
            toast.info("Seu carrinho está vazio.");
            navigate('/loja');
        }
    }, [user, isAuthReady, items.length, isSubmittingOrder, navigate]);

    // Busca os endereços salvos
    useEffect(() => {
        if (!user) return;
        setLoadingAddresses(true);
        const addressesRef = collection(db, 'users', user.uid, 'addresses');
        const q = query(addressesRef);

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedAddresses = [];
            querySnapshot.forEach((doc) => {
                fetchedAddresses.push({ id: doc.id, ...doc.data() });
            });
            setAddresses(fetchedAddresses);
            
            const defaultAddress = fetchedAddresses.find(a => a.isDefault);
            if (defaultAddress) {
                setSelectedAddressId(defaultAddress.id);
            } else if (fetchedAddresses.length > 0) {
                setSelectedAddressId(fetchedAddresses[0].id);
            } else {
                setShowNewAddressForm(true); 
            }
            setLoadingAddresses(false);
        }, (error) => {
            console.error("Erro ao buscar endereços:", error);
            setLoadingAddresses(false);
        });
        return () => unsubscribe();
    }, [user]);

    // Handler: Selecionar um endereço (Card)
    const handleSelectAddress = (address) => {
        setSelectedAddressId(address.id);
        setShowNewAddressForm(false);
    };

    // Handler: Aplicar Cupom
    const handleApplyCoupon = async () => {
        if (couponCode.trim() === '') return;
        
        setIsCheckingCoupon(true);
        setCouponError(null);
        setAppliedCoupon(null);
        const code = couponCode.toUpperCase();

        try {
            const couponsRef = collection(db, 'coupons');
            const q = query(couponsRef, where('code', '==', code), limit(1));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                throw new Error("Cupom inválido ou não encontrado.");
            }
            
            const coupon = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };

            // Validações do Cupom
            if (!coupon.isActive) throw new Error("Este cupom não está mais ativo.");
            if (coupon.expiresAt && coupon.expiresAt.toDate() < new Date()) throw new Error("Este cupom expirou.");
            if (coupon.maxUses > 0 && coupon.uses >= coupon.maxUses) throw new Error("Este cupom atingiu o limite de usos.");
            if (coupon.minPurchase > 0 && subtotal < coupon.minPurchase) {
                throw new Error(`O pedido mínimo para este cupom é ${formatCurrency(coupon.minPurchase)}.`);
            }

            setAppliedCoupon(coupon);
            toast.success("Cupom aplicado com sucesso!");
        } catch (error) {
            setCouponError(error.message);
        } finally {
            setIsCheckingCoupon(false);
        }
    };

    // Handler: Submissão do Pedido
    const handleOrderSubmit = async (data) => {
        setIsSubmittingOrder(true);
        setFormError(null);

        let addressToSave;

        if (showNewAddressForm) {
            // Se o formulário de novo endereço está aberto, 'data' (do handleSubmit) é o endereço
            addressToSave = data;
        } else if (selectedAddressId) {
            // Se um card está selecionado, pega o endereço da lista
            addressToSave = addresses.find(a => a.id === selectedAddressId);
        }
        
        if (!addressToSave) {
            toast.error("Por favor, selecione ou cadastre um endereço de entrega.");
            setIsSubmittingOrder(false);
            return;
        }

        const orderData = {
          userId: user.uid, userEmail: user.email, userName: user.displayName,
          itens: items, 
          subtotal: subtotal,
          discount: discount,
          total: finalTotal,
          appliedCoupon: appliedCoupon ? { code: appliedCoupon.code, value: appliedCoupon.value, type: appliedCoupon.type, id: appliedCoupon.id } : null,
          status: "processando",
          enderecoEnvio: addressToSave, 
          dataPedido: serverTimestamp(),
        };

        try {
          const orderRef = await addDoc(collection(db, 'orders'), orderData);
          const userRef = doc(db, 'users', user.uid);

          // Se foi um novo endereço, salva ele no perfil
          if (showNewAddressForm) {
             const addressesRef = collection(db, 'users', user.uid, 'addresses');
             await addDoc(addressesRef, { ...data, isDefault: addresses.length === 0 });
          }
          
          await setDoc(userRef, { historicoPedidos: arrayUnion(orderRef.id) }, { merge: true } );
          clearCart();
          toast.success("Pedido realizado com sucesso!");
          navigate('/meus-pedidos'); 
        } catch (error) {
          console.error("Erro ao criar pedido: ", error);
          setFormError("Não foi possível processar seu pedido.");
        } finally {
          setIsSubmittingOrder(false);
        }
    };
    
    if (!isAuthReady || loadingAddresses || !user) {
        return <Loading />;
    }

    return (
        <div className={`container ${styles.checkoutPage}`}>
            <h1 className={styles.title}>Finalizar Compra</h1>
            <div className={styles.checkoutGrid}>
                
                {/* Coluna 1: Formulário */}
                <div className={styles.formColumn}>
                    {/* O 'id' "checkout-form" é usado pelo botão "Finalizar Pedido" */}
                    <form onSubmit={handleSubmit(handleOrderSubmit)} id="checkout-form">
                        
                        {/* Seção de Seleção de Endereço */}
                        <section className={styles.formSection}>
                            <h2>1. Selecione o Endereço de Entrega</h2>
                            <div className={styles.addressSelector}>
                                {addresses.map(addr => (
                                    <button key={addr.id} type="button" className={`${styles.addressCard} ${selectedAddressId === addr.id ? styles.selectedCard : ''}`} onClick={() => handleSelectAddress(addr)}>
                                        {selectedAddressId === addr.id ? <FaCheckCircle /> : <FaRegCircle />}
                                        <div className={styles.addressInfo}>
                                            <strong>{addr.apelido}</strong>
                                            <p>{addr.rua}, {addr.numero} - {addr.bairro}</p>
                                        </div>
                                    </button>
                                ))}
                                <button type="button" className={`${styles.addressCard} ${showNewAddressForm ? styles.selectedCard : ''}`} onClick={() => { setShowNewAddressForm(true); setSelectedAddressId(null); reset(); }}>
                                    {showNewAddressForm ? <FaCheckCircle /> : <FaRegCircle />}
                                    <div className={styles.addressInfo}>
                                        <strong>Adicionar novo endereço</strong>
                                        <p>Preencha os dados abaixo</p>
                                    </div>
                                </button>
                            </div>
                        </section>
                        
                        {/* Seção de Novo Endereço (Condicional) */}
                        {showNewAddressForm && (
                            <section className={styles.formSection}>
                                <h2>2. Preencha o Novo Endereço</h2>
                                <div className={styles.addressForm}>
                                    <div className={styles.formGroup}><label htmlFor="apelido">Apelido (ex: Casa)</label><input id="apelido" {...register("apelido")} />{errors.apelido && <span className={styles.error}>{errors.apelido.message}</span>}</div>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="cep">CEP</label>
                                        <div className={styles.cepInputWrapper}>
                                            <input id="cep" {...register("cep")} maxLength={9} onChange={(e) => { const formattedCep = e.target.value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2'); setValue('cep', formattedCep, { shouldValidate: true }); }} />
                                            {isCepLoading && <FaSpinner className={styles.cepSpinner} />}
                                        </div>
                                        {errors.cep && <span className={styles.error}>{errors.cep.message}</span>}
                                    </div>
                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup} style={{flex: 3}}><label htmlFor="rua">Rua</label><input id="rua" {...register("rua")} />{errors.rua && <span className={styles.error}>{errors.rua.message}</span>}</div>
                                        <div className={styles.formGroup} style={{flex: 1}}><label htmlFor="numero">Número</label><input id="numero" {...register("numero")} />{errors.numero && <span className={styles.error}>{errors.numero.message}</span>}</div>
                                    </div>
                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup} style={{flex: 1}}><label htmlFor="complemento">Complemento (Opc)</label><input id="complemento" {...register("complemento")} /></div>
                                        <div className={styles.formGroup} style={{flex: 2}}><label htmlFor="bairro">Bairro</label><input id="bairro" {...register("bairro")} />{errors.bairro && <span className={styles.error}>{errors.bairro.message}</span>}</div>
                                    </div>
                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup} style={{flex: 3}}><label htmlFor="cidade">Cidade</label><input id="cidade" {...register("cidade")} />{errors.cidade && <span className={styles.error}>{errors.cidade.message}</span>}</div>
                                        <div className={styles.formGroup} style={{flex: 1}}><label htmlFor="estado">UF</label><input id="estado" {...register("estado")} maxLength={2} />{errors.estado && <span className={styles.error}>{errors.estado.message}</span>}</div>
                                    </div>
                                </div>
                            </section>
                        )}
                        
                        <section className={styles.formSection}>
                            <h2>{showNewAddressForm ? '3.' : '2.'} Pagamento</h2>
                            <div className={styles.paymentSimulation}>
                                <p>Seu pedido será processado e está sujeito à aprovação de estoque.</p>
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
                                <div className={styles.itemInfo}><p>{item.nome}</p><small>{item.color} / {item.size}</small></div>
                                <span className={styles.itemPrice}>{item.quantity}x {formatCurrency(item.price)}</span>
                                </div>
                            ))}
                        </div>
                        
                        <div className={styles.couponSection}>
                            <label htmlFor="coupon">Cupom de Desconto</label>
                            <div className={styles.couponInput}>
                                <input type="text" id="coupon" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Ex: BEMVINDO10" disabled={isCheckingCoupon || !!appliedCoupon} />
                                <button type="button" onClick={handleApplyCoupon} disabled={isCheckingCoupon || !!appliedCoupon}>
                                    {isCheckingCoupon ? <FaSpinner className={styles.spinner} /> : "Aplicar"}
                                </button>
                            </div>
                            {couponError && <span className={styles.error}>{couponError}</span>}
                            {appliedCoupon && (<span className={styles.success}><FaTag /> Cupom "{appliedCoupon.code}" aplicado!</span>)}
                        </div>
            
                        <div className={styles.summaryRow}><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                        {discount > 0 && (<div className={`${styles.summaryRow} ${styles.discountRow}`}><span>Desconto (Cupom)</span><span>- {formatCurrency(discount)}</span></div>)}
                        <div className={styles.summaryRow}><span>Frete</span><span>Grátis</span></div>
                        <div className={`${styles.summaryRow} ${styles.total}`}><strong>Total</strong><strong>{formatCurrency(finalTotal)}</strong></div>
                        
                        {formError && <span className={styles.error}>{formError}</span>}
                        
                        <button 
                            type="submit" 
                            // Se o form de novo endereço estiver visível, o botão submete o formulário
                            form={showNewAddressForm ? "checkout-form" : undefined} 
                            // Se não, ele chama o handler diretamente com o endereço selecionado
                            onClick={!showNewAddressForm ? () => handleOrderSubmit(addresses.find(a => a.id === selectedAddressId)) : undefined}
                            className={styles.ctaButton}
                            disabled={isSubmittingOrder || isCepLoading || (!showNewAddressForm && !selectedAddressId)} // Desabilita se nada estiver selecionado
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