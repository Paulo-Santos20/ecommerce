import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form'; // Ainda necessário para o form principal
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { db } from '../../firebase/config';
import { collection, addDoc, doc, setDoc, serverTimestamp, arrayUnion, query, onSnapshot } from 'firebase/firestore';
import { toast } from 'react-toastify';
import Loading from '../../components/ui/Loading/Loading';
import AddressForm from '../../components/forms/AddressForm/AddressForm'; // 1. Importa o Form
import { FaCheckCircle, FaRegCircle } from 'react-icons/fa';
import styles from './Checkout.module.css'; // O CSS será atualizado

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const Checkout = () => {
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
    const [formError, setFormError] = useState(null);
    const navigate = useNavigate();

    // --- Stores e Dados ---
    const items = useCartStore((state) => state.items);
    const clearCart = useCartStore((state) => state.clearCart);
    const user = useAuthStore((state) => state.user);
    const isAuthReady = useAuthStore((state) => state.isAuthReady);
    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    
    // --- Lógica de Endereço ---
    const [addresses, setAddresses] = useState([]);
    const [loadingAddresses, setLoadingAddresses] = useState(true);
    // Armazena o ID do card selecionado OU 'new' para o formulário
    const [selectedAddressId, setSelectedAddressId] = useState(null); 
    
    // 2. Hook para o formulário de endereço (que será preenchido dinamicamente)
    // Usamos o hook do AddressForm
    const { handleSubmit: handleSubmitAddress, control: addressControl, reset: resetAddressForm } = useForm();

    // Guarda de Roteamento (inalterada)
    useEffect(() => {
        if (!isAuthReady) return; 
        if (!user) {
            toast.warn("Você precisa estar logado.");
            navigate('/login?redirect=/checkout');
        }
        if (items.length === 0 && !isSubmittingOrder) {
            toast.info("Seu carrinho está vazio.");
            navigate('/loja');
        }
    }, [user, isAuthReady, items.length, isSubmittingOrder, navigate]);

    // 3. Busca os endereços salvos
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
            
            // --- REQUISITO: Preenche automaticamente ---
            // Tenta encontrar o endereço padrão
            const defaultAddress = fetchedAddresses.find(a => a.isDefault);
            if (defaultAddress) {
                setSelectedAddressId(defaultAddress.id);
                resetAddressForm(defaultAddress); // Preenche o form
            } else if (fetchedAddresses.length > 0) {
                // Ou seleciona o primeiro
                setSelectedAddressId(fetchedAddresses[0].id);
                resetAddressForm(fetchedAddresses[0]);
            } else {
                // Ou força o formulário de "novo"
                setSelectedAddressId('new'); 
            }
            setLoadingAddresses(false);
        }, (error) => {
            console.error("Erro ao buscar endereços:", error);
            setLoadingAddresses(false);
        });

        return () => unsubscribe();
    }, [user, resetAddressForm]);

    // 4. Handler para selecionar um endereço (Card)
    const handleSelectAddress = (address) => {
        setSelectedAddressId(address.id);
        resetAddressForm(address); // Preenche o formulário com o endereço clicado
    };

    // 5. Handler para submissão (agora usa o AddressForm)
    const handleOrderSubmit = async (data) => {
        // 'data' vem do <AddressForm />
        setIsSubmittingOrder(true);
        setFormError(null);
        
        // (Lógica de criação do pedido inalterada)
        const orderData = {
          userId: user.uid, userEmail: user.email, userName: user.displayName,
          itens: items, total: subtotal, status: "processando",
          enderecoEnvio: data, dataPedido: serverTimestamp(),
        };
        try {
          const orderRef = await addDoc(collection(db, 'orders'), orderData);
          const userRef = doc(db, 'users', user.uid);
          
          // Salva o endereço apenas se for novo
          const addressExists = addresses.some(a => a.cep === data.cep && a.rua === data.rua);
          if (selectedAddressId === 'new' && !addressExists) {
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
    
    if (!isAuthReady || loadingAddresses || !user || (items.length === 0 && !isSubmittingOrder)) {
        return <Loading />;
    }

    return (
        <div className={`container ${styles.checkoutPage}`}>
            <h1 className={styles.title}>Finalizar Compra</h1>
            <div className={styles.checkoutGrid}>
                {/* Coluna 1: Formulário */}
                <div className={styles.formColumn}>
                    {/* --- REQUISITO: Seleção de Endereços Salvos --- */}
                    <section className={styles.formSection}>
                        <h2>1. Selecione o Endereço de Entrega</h2>
                        <div className={styles.addressSelector}>
                            {addresses.map(addr => (
                                <button 
                                    key={addr.id} 
                                    className={`${styles.addressCard} ${selectedAddressId === addr.id ? styles.selectedCard : ''}`}
                                    onClick={() => handleSelectAddress(addr)}
                                >
                                    {selectedAddressId === addr.id ? <FaCheckCircle /> : <FaRegCircle />}
                                    <div className={styles.addressInfo}>
                                        <strong>{addr.apelido}</strong>
                                        <p>{addr.rua}, {addr.numero} - {addr.bairro}</p>
                                    </div>
                                </button>
                            ))}
                            {/* Botão para adicionar novo */}
                            <button 
                                className={`${styles.addressCard} ${selectedAddressId === 'new' ? styles.selectedCard : ''}`}
                                onClick={() => { setSelectedAddressId('new'); resetAddressForm({}); }}
                            >
                                <FaRegCircle />
                                <div className={styles.addressInfo}>
                                    <strong>Adicionar novo endereço</strong>
                                    <p>Preencha os dados abaixo</p>
                                </div>
                            </button>
                        </div>
                    </section>
                    
                    {/* --- Formulário (só aparece se 'novo' for selecionado ou para edição) --- */}
                    <section className={styles.formSection}>
                        <h2>{selectedAddressId === 'new' ? '2. Preencha o Novo Endereço' : '2. Verifique seu Endereço'}</h2>
                        {/* 6. Usa o AddressForm (controlado pelo 'handleSubmitAddress') */}
                        <AddressForm 
                            onSubmit={handleOrderSubmit}
                            defaultValues={addresses.find(a => a.id === selectedAddressId)} // Passa os valores padrão
                            submitText="Ir para Pagamento" // Texto customizado
                            isSubmitting={isSubmittingOrder}
                        />
                    </section>
                    
                    {/* Seção de Pagamento */}
                    <section className={styles.formSection}>
                        <h2>3. Pagamento</h2>
                        <div className={styles.paymentSimulation}>
                            <p>Seu pedido será processado e está sujeito à aprovação de estoque.</p>
                        </div>
                    </section>
                </div>

                {/* Coluna 2: Resumo do Pedido */}
                <div className={styles.summaryColumn}>
                    <div className={styles.orderSummary}>
                        {/* ... (Conteúdo do Resumo inalterado) ... */}
                        <button 
                            type="submit" 
                            form="address-form" // ID do formulário dentro do <AddressForm>
                            className={styles.ctaButton}
                            disabled={isSubmittingOrder || isCepLoading}
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