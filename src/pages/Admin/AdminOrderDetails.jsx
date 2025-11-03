import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Loading from '../../components/ui/Loading/Loading';
import { toast } from 'react-toastify';
import { FaBox, FaUser, FaMapMarkedAlt, FaArrowLeft, FaSpinner } from 'react-icons/fa';
import styles from './AdminOrderDetails.module.css'; // Novo CSS

// --- Helpers ---
const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return '...';
    return timestamp.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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

const STATUS_OPTIONS = ["processando", "enviado", "entregue", "cancelado"];

const AdminOrderDetails = () => {
    const { id: orderId } = useParams(); // Pega o ID do pedido da URL
    const navigate = useNavigate();
    
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentStatus, setCurrentStatus] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    // Busca os dados do pedido específico
    useEffect(() => {
        if (!orderId) {
            setError("ID do pedido não encontrado.");
            setLoading(false);
            return;
        }

        const fetchOrder = async () => {
            setLoading(true);
            try {
                const orderRef = doc(db, 'orders', orderId);
                const docSnap = await getDoc(orderRef);

                if (docSnap.exists()) {
                    setOrder({ id: docSnap.id, ...docSnap.data() });
                    setCurrentStatus(docSnap.data().status);
                } else {
                    setError("Pedido não encontrado.");
                }
            } catch (err) {
                console.error("Erro ao buscar pedido:", err);
                setError("Não foi possível carregar o pedido.");
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId]);

    // Handler para atualizar o status do pedido
    const handleStatusChange = async () => {
        if (isUpdating || order.status === currentStatus) return; // Não faz nada se já estiver atualizando ou se for o mesmo status

        setIsUpdating(true);
        try {
            const orderRef = doc(db, 'orders', orderId);
            await updateDoc(orderRef, {
                status: currentStatus
            });
            
            // Atualiza o estado local do pedido também
            setOrder(prevOrder => ({ ...prevOrder, status: currentStatus }));
            toast.success(`Status do pedido atualizado para "${currentStatus}"`);

            // TODO (Back-end): Disparar uma Cloud Function aqui
            // para enviar uma notificação por e-mail E uma notificação
            // para a subcoleção 'users/{userId}/notifications'
            // Ex: "Seu pedido [ID] foi enviado!"

        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            toast.error("Falha ao atualizar o status.");
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading) return <Loading />;

    if (error) {
        return (
            <div className={styles.errorPage}>
                <h2>{error}</h2>
                <Link to="/admin/pedidos" className={styles.backButton}>Voltar para Pedidos</Link>
            </div>
        );
    }

    if (!order) return <Loading />; // Se não estiver carregando, mas o pedido for nulo

    return (
        <div className={styles.detailsPage}>
            {/* Cabeçalho com ID e botão Voltar */}
            <div className={styles.pageHeader}>
                <Link to="/admin/pedidos" className={styles.backButton}>
                    <FaArrowLeft /> Voltar para todos os pedidos
                </Link>
                <h1>Pedido: <span>{order.id.substring(0, 8).toUpperCase()}</span></h1>
            </div>

            {/* Grid principal */}
            <div className={styles.mainGrid}>
                {/* Coluna da Esquerda (Resumo, Cliente, Endereço) */}
                <div className={styles.leftColumn}>
                    {/* Card 1: Resumo do Pedido */}
                    <div className={styles.detailCard}>
                        <h2><FaBox /> Resumo do Pedido</h2>
                        <div className={styles.infoRow}>
                            <span>Data do Pedido:</span>
                            <strong>{formatDate(order.dataPedido)}</strong>
                        </div>
                        <div className={styles.infoRow}>
                            <span>Valor Total:</span>
                            <strong>{formatCurrency(order.total)}</strong>
                        </div>
                        <div className={styles.infoRow}>
                            <span>Status Atual:</span>
                            <span className={`${styles.statusBadge} ${getStatusClass(order.status)}`}>
                                {order.status}
                            </span>
                        </div>
                        <div className={styles.statusUpdater}>
                            <label>Alterar Status:</label>
                            <div className={styles.statusAction}>
                                <select 
                                    value={currentStatus} 
                                    onChange={(e) => setCurrentStatus(e.target.value)}
                                >
                                    {STATUS_OPTIONS.map(opt => (
                                        <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                                    ))}
                                </select>
                                <button onClick={handleStatusChange} disabled={isUpdating || order.status === currentStatus}>
                                    {isUpdating ? <FaSpinner className={styles.spinner} /> : "Salvar"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Cliente */}
                    <div className={styles.detailCard}>
                        <h2><FaUser /> Cliente</h2>
                        <div className={styles.infoRow}>
                            <span>Nome:</span>
                            <strong>{order.userName}</strong>
                        </div>
                        <div className={styles.infoRow}>
                            <span>E-mail:</span>
                            <strong>{order.userEmail}</strong>
                        </div>
                        <div className={styles.infoRow}>
                            <span>ID do Cliente:</span>
                            <small>{order.userId}</small>
                        </div>
                    </div>

                    {/* Card 3: Endereço de Entrega */}
                    <div className={styles.detailCard}>
                        <h2><FaMapMarkedAlt /> Endereço de Entrega</h2>
                        <address>
                            <strong>{order.enderecoEnvio.rua}, {order.enderecoEnvio.numero}</strong>
                            {order.enderecoEnvio.complemento && <p>{order.enderecoEnvio.complemento}</p>}
                            <p>{order.enderecoEnvio.bairro}</p>
                            <p>{order.enderecoEnvio.cidade} - {order.enderecoEnvio.estado}</p>
                            <p>CEP: {order.enderecoEnvio.cep}</p>
                        </address>
                    </div>
                </div>

                {/* Coluna da Direita (Itens) */}
                <div className={styles.rightColumn}>
                    <div className={styles.detailCard}>
                        <h2>Itens do Pedido ({order.itens.length})</h2>
                        <div className={styles.orderItemsList}>
                            {order.itens.map(item => (
                                <div key={item.id} className={styles.itemRow}>
                                    <img src={item.imagem} alt={item.nome} className={styles.itemImage} />
                                    <div className={styles.itemInfo}>
                                        <p className={styles.itemName}>{item.nome}</p>
                                        <small>Cor: {item.color} / Tam: {item.size}</small>
                                        <small>ID do SKU: {item.id}</small>
                                    </div>
                                    <div className={styles.itemPrice}>
                                        {formatCurrency(item.price)}
                                        <span>x {item.quantity}</span>
                                        <strong>{formatCurrency(item.price * item.quantity)}</strong>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className={styles.totalRow}>
                            <span>Subtotal:</span>
                            <span>{formatCurrency(order.total)}</span>
                        </div>
                         <div className={styles.totalRow}>
                            <span>Frete:</span>
                            <span>Grátis</span>
                        </div>
                        <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                            <strong>Total:</strong>
                            <strong>{formatCurrency(order.total)}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOrderDetails;