import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useAuthStore } from '../../store/useAuthStore';
import Loading from '../../components/ui/Loading/Loading';
import { FaWhatsapp, FaStar, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import styles from './MyOrders.module.css';

// ... (helpers formatCurrency, formatDate, getStatusClass) ...
const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return 'Data indisponível';
    return timestamp.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};
const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
        case 'processando': return styles.statusProcessing;
        case 'enviado': return styles.statusShipped;
        case 'entregue': return styles.statusDelivered;
        case 'cancelado': return styles.statusCancelled;
        default: return styles.statusDefault;
    }
};

const WHATSAPP_NUMBER = "5581999998888"; // Seu número

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // --- CORREÇÃO DA GUARDA DE ROTEAMENTO ---
    const user = useAuthStore((state) => state.user);
    const isAuthReady = useAuthStore((state) => state.isAuthReady);
    const navigate = useNavigate();
    // ------------------------------------
    
    const [openDetailsOrderId, setOpenDetailsOrderId] = useState(null);

    useEffect(() => {
        // 1. Espera o Auth estar pronto
        if (!isAuthReady) {
          return; // Mostra o Loading
        }
        
        // 2. Se estiver pronto E não houver usuário, redireciona
        if (!user) {
            navigate('/login?redirect=/meus-pedidos');
            return; 
        }

        // 3. Se estiver pronto E logado, busca os pedidos
        const fetchOrders = async () => {
            setLoading(true);
            setError(null);
            try {
                const ordersRef = collection(db, 'orders');
                const q = query(
                    ordersRef,
                    where('userId', '==', user.uid),
                    orderBy('dataPedido', 'desc')
                );
                const querySnapshot = await getDocs(q);
                const fetchedOrders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setOrders(fetchedOrders);
            } catch (err) {
                console.error("Erro ao buscar pedidos:", err);
                setError("Não foi possível carregar seus pedidos.");
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();

    }, [user, isAuthReady, navigate]); // Adiciona isAuthReady

    const toggleDetails = (orderId) => {
        setOpenDetailsOrderId(prevId => (prevId === orderId ? null : orderId));
    };

    const generateWhatsAppLink = (orderId) => {
        const shortId = orderId.substring(0, 8).toUpperCase();
        const message = `Olá, Fina Estampa! Preciso de ajuda com o pedido Nº ${shortId}.`;
        return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    };

    // Mostra Loading enquanto o auth (ou os pedidos) não está pronto
    if (loading || !isAuthReady) {
        return <Loading />;
    }
    // --- FIM DA CORREÇÃO ---

    if (error) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>
                <h1 style={{ color: 'var(--color-primary)', fontSize: '2.4rem' }}>Erro</h1>
                <p style={{ fontSize: '1.6rem', marginBottom: '2rem' }}>{error}</p>
                <Link to="/" style={{ fontSize: '1.8rem', textDecoration: 'underline' }}>Voltar para a Home</Link>
            </div>
        );
    }

    return (
        <div className={`container ${styles.myOrdersPage}`}>
            <h1 className={styles.title}>Meus Pedidos</h1>
            {orders.length === 0 ? (
                <div className={styles.noOrders}>
                    <h2>Você ainda não fez nenhum pedido.</h2>
                    <Link to="/loja" className={styles.ctaButton}>Ir para a Loja</Link>
                </div>
            ) : (
                <div className={styles.orderList}>
                    {orders.map(order => {
                        const isDetailsOpen = openDetailsOrderId === order.id;
                        const deliveryStatus = order.status === 'enviado' || order.status === 'entregue' 
                            ? "Seu pedido foi enviado." : "Aguardando separação no estoque.";
                        const trackingCode = order.status === 'enviado' || order.status === 'entregue'
                            ? `BR123456${order.id.substring(4, 8)}BR` : null;

                        return (
                            <div key={order.id} className={styles.orderCard}>
                                <div className={styles.orderHeader}>
                                    <div className={styles.headerInfo}><span>Pedido realizado em:</span><strong>{formatDate(order.dataPedido)}</strong></div>
                                    <div className={styles.headerInfo}><span>Total:</span><strong>{formatCurrency(order.total)}</strong></div>
                                    <div className={styles.headerInfo}><span>Pedido Nº:</span><strong>{order.id.substring(0, 8).toUpperCase()}</strong></div>
                                    <div className={`${styles.headerInfo} ${styles.statusWrapper}`}>
                                        <span className={`${styles.statusBadge} ${getStatusClass(order.status)}`}>{order.status || 'Indefinido'}</span>
                                    </div>
                                </div>
                                <div className={styles.orderItems}>
                                    {order.itens.map(item => (
                                        <div key={item.id} className={styles.orderItem}>
                                            <img src={item.imagem} alt={item.nome} className={styles.itemImage} />
                                            <div className={styles.itemDetails}>
                                                <p>{item.nome}</p>
                                                <small>{item.color} / {item.size}</small>
                                                <span>{item.quantity} x {formatCurrency(item.price)}</span>
                                            </div>
                                            <Link to={`/produto/${item.productId}#avaliacoes`} className={styles.reviewButton}>
                                                <FaStar /> Avaliar
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                                {isDetailsOpen && (
                                    <div className={styles.deliveryDetails}>
                                        <h4>Detalhes da Entrega</h4>
                                        <div className={styles.detailsContent}>
                                            <div className={styles.addressInfo}>
                                                <strong>Endereço de Entrega:</strong>
                                                <p>{order.enderecoEnvio.rua}, {order.enderecoEnvio.numero}</p>
                                                <p>{order.enderecoEnvio.bairro}, {order.enderecoEnvio.cidade} - {order.enderecoEnvio.estado}</p>
                                                <p>CEP: {order.enderecoEnvio.cep}</p>
                                            </div>
                                            <div className={styles.trackingInfo}>
                                                <strong>Status:</strong>
                                                <p>{deliveryStatus}</p>
                                                {trackingCode && ( <><strong>Código de Rastreio:</strong><p className={styles.trackingCode}>{trackingCode}</p></> )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className={styles.orderFooter}>
                                    <a href={generateWhatsAppLink(order.id)} target="_blank" rel="noopener noreferrer" className={`${styles.footerButton} ${styles.helpButton}`}>
                                        <FaWhatsapp /> Preciso de ajuda
                                    </a>
                                    <button onClick={() => toggleDetails(order.id)} className={styles.footerButton}>
                                        {isDetailsOpen ? 'Ocultar Detalhes' : 'Detalhes da entrega'}
                                        {isDetailsOpen ? <FaChevronUp /> : <FaChevronDown />}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyOrders;