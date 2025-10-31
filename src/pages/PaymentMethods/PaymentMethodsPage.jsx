import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../../firebase/config';
import { collection, query, onSnapshot, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { useAuthStore } from '../../store/useAuthStore';
import Loading from '../../components/ui/Loading/Loading';
import { toast } from 'react-toastify';
import { FaCcVisa, FaCcMastercard, FaCreditCard, FaTrash, FaPlus, FaSpinner } from 'react-icons/fa';
import styles from './PaymentMethodsPage.module.css'; // Novo CSS

// Helper para simular a bandeira do cartão
const getCardIcon = (brand) => {
    if (brand.toLowerCase() === 'visa') return <FaCcVisa />;
    if (brand.toLowerCase() === 'mastercard') return <FaCcMastercard />;
    return <FaCreditCard />;
};

const PaymentMethodsPage = () => {
    const [methods, setMethods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    
    // --- Dados do Formulário (Simulação) ---
    const [cardNumber, setCardNumber] = useState('');
    const [cardName, setCardName] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [formError, setFormError] = useState('');
    
    // --- Autenticação e Guarda de Rota ---
    const user = useAuthStore((state) => state.user);
    const isAuthReady = useAuthStore((state) => state.isAuthReady);
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthReady && !user) {
            toast.warn("Você precisa estar logado.");
            navigate('/login?redirect=/formas-de-pagamento');
        }
    }, [user, isAuthReady, navigate]);

    // Busca os métodos de pagamento (da subcoleção)
    useEffect(() => {
        if (!user) return;
        setLoading(true);
        const methodsRef = collection(db, 'users', user.uid, 'paymentMethods');
        const q = query(methodsRef);

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedMethods = [];
            querySnapshot.forEach((doc) => {
                fetchedMethods.push({ id: doc.id, ...doc.data() });
            });
            setMethods(fetchedMethods);
            setLoading(false);
        }, (error) => {
            console.error("Erro ao buscar métodos de pagamento: ", error);
            toast.error("Erro ao carregar seus cartões.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Handler: Adicionar novo Cartão (Simulado)
    const handleAddMethod = async (e) => {
        e.preventDefault();
        setFormError('');

        // Validação simples (simulação)
        if (cardNumber.length < 16 || cardExpiry.length < 5 || cardCvv.length < 3) {
            setFormError("Por favor, preencha todos os dados fictícios do cartão.");
            return;
        }

        setIsSubmitting(true);
        
        // --- SIMULAÇÃO ---
        // Em um app real, aqui você enviaria os dados para o Stripe/Mercado Pago
        // e receberia um token (ex: 'pm_123abc...').
        
        // Vamos simular isso com um timeout
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const brand = cardNumber.startsWith('4') ? 'visa' : 'mastercard';
        const last4 = cardNumber.slice(-4);
        
        const newMethodData = {
            // Em um app real, 'paymentMethodId' seria o token do gateway
            paymentMethodId: `pm_sim_${Math.random().toString(36).substr(2, 9)}`,
            brand: brand,
            last4: last4,
            expiry: cardExpiry
        };

        try {
            const methodsRef = collection(db, 'users', user.uid, 'paymentMethods');
            await addDoc(methodsRef, newMethodData);
            
            toast.success(`Cartão final ${last4} salvo com sucesso!`);
            setShowForm(false);
            // Limpa o formulário
            setCardNumber(''); setCardName(''); setCardExpiry(''); setCardCvv('');
        } catch (error) {
            console.error("Erro ao salvar método:", error);
            toast.error("Não foi possível salvar o cartão.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handler: Deletar Cartão
    const handleDelete = async (methodId) => {
        if (!window.confirm("Tem certeza que deseja excluir este método de pagamento?")) return;

        try {
            // Em um app real, você primeiro faria uma chamada à API do Stripe/Gateway
            // para "desanexar" (detach) o método de pagamento do cliente.
            
            const methodRef = doc(db, 'users', user.uid, 'paymentMethods', methodId);
            await deleteDoc(methodRef);
            toast.success("Método de pagamento excluído.");
        } catch (error) {
            console.error("Erro ao excluir método:", error);
            toast.error("Erro ao excluir.");
        }
    };

    if (!isAuthReady || loading) {
        return <Loading />;
    }

    return (
        <div className={`container ${styles.pageWrapper}`}>
            <h1 className={styles.title}>Formas de Pagamento</h1>
            <p className={styles.subtitle}>Gerencie seus cartões salvos para compras futuras.</p>
            
            {/* Lista de Cartões Salvos */}
            <div className={styles.paymentList}>
                {methods.length === 0 && !showForm && (
                    <p className={styles.noMethods}>Nenhum método de pagamento cadastrado.</p>
                )}
                {methods.map(method => (
                    <div key={method.id} className={styles.paymentCard}>
                        <div className={styles.cardIcon}>{getCardIcon(method.brand)}</div>
                        <div className={styles.cardDetails}>
                            <strong>Cartão final •••• {method.last4}</strong>
                            <p>Válido até: {method.expiry}</p>
                        </div>
                        <button onClick={() => handleDelete(method.id)} className={styles.deleteBtn}>
                            <FaTrash />
                        </button>
                    </div>
                ))}
            </div>

            {/* Botão para mostrar o formulário */}
            {!showForm && (
                <button className={styles.showFormButton} onClick={() => setShowForm(true)}>
                    <FaPlus /> Adicionar Novo Cartão
                </button>
            )}

            {/* Formulário de Adição (Simulado) */}
            {showForm && (
                <div className={styles.formContainer}>
                    <h2>Adicionar Novo Cartão de Crédito</h2>
                    
                    {/* Nota de Segurança (UI/UX de Excelência) */}
                    <blockquote className={styles.securityNote}>
                        <strong>Ambiente de Simulação:</strong> Em um site real, você digitaria seus dados em um campo seguro (PCI-Compliant). Nós nunca armazenamos o número completo do seu cartão.
                    </blockquote>
                    
                    <form onSubmit={handleAddMethod}>
                        <div className={styles.formGroup}>
                            <label htmlFor="cardName">Nome (como está no cartão)</label>
                            <input id="cardName" value={cardName} onChange={(e) => setCardName(e.target.value)} />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="cardNumber">Número do Cartão (fictício)</label>
                            <input id="cardNumber" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="0000 0000 0000 0000" maxLength={16} />
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label htmlFor="cardExpiry">Validade (MM/AA)</label>
                                <input id="cardExpiry" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="MM/AA" maxLength={5} />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="cardCvv">CVV (fictício)</label>
                                <input id="cardCvv" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} placeholder="123" maxLength={3} />
                            </div>
                        </div>
                        
                        {formError && <span className={styles.error}>{formError}</span>}
                        
                        <div className={styles.actions}>
                             <button type="button" className={styles.cancelButton} onClick={() => setShowForm(false)}>
                                Cancelar
                            </button>
                            <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                                {isSubmitting ? <FaSpinner className={styles.spinner} /> : "Salvar Cartão"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default PaymentMethodsPage;