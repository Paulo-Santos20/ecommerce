import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../firebase/config';
import { collection, query, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useAuthStore } from '../../store/useAuthStore';
import Loading from '../../components/ui/Loading/Loading';
import { toast } from 'react-toastify';
import { FaSearch, FaRegEdit } from 'react-icons/fa';
import styles from './AdminOrders.module.css'; // Novo CSS

// --- Helpers ---
const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return '...';
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

const STATUS_OPTIONS = ["processando", "enviado", "entregue", "cancelado"];

const AdminOrders = () => {
    const [masterOrderList, setMasterOrderList] = useState([]); // Todos os pedidos
    const [filteredOrders, setFilteredOrders] = useState([]); // Pedidos após o filtro
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // --- Estados dos Filtros ---
    const [statusFilter, setStatusFilter] = useState('processando'); // Padrão
    const [dateFilter, setDateFilter] = useState(''); // YYYY-MM-DD
    const [searchFilter, setSearchFilter] = useState(''); // Nome ou Email

    const { user } = useAuthStore(); // Para garantir que é admin (embora AdminRoute já proteja)

    // 1. Busca todos os pedidos uma vez
    useEffect(() => {
        const fetchAllOrders = async () => {
            setLoading(true);
            setError(null);
            try {
                const ordersRef = collection(db, 'orders');
                const q = query(ordersRef, orderBy('dataPedido', 'desc'));
                
                const querySnapshot = await getDocs(q);
                const fetchedOrders = querySnapshot.docs.map(doc => ({ 
                    id: doc.id, 
                    ...doc.data(),
                    // Adiciona data formatada para facilitar a filtragem por data
                    dataPedidoString: doc.data().dataPedido.toDate().toISOString().split('T')[0]
                }));
                
                setMasterOrderList(fetchedOrders);
                setFilteredOrders(fetchedOrders); // Inicialmente, mostra todos

            } catch (err) {
                console.error("Erro ao buscar pedidos:", err);
                setError("Não foi possível carregar os pedidos.");
            } finally {
                setLoading(false);
            }
        };
        
        fetchAllOrders();
    }, []);

    // 2. Aplica os filtros (Client-Side) sempre que um filtro mudar
    // (Princípio: Performance Total - evita novas leituras do DB)
    useEffect(() => {
        let tempOrders = [...masterOrderList];

        // Filtro de Status
        if (statusFilter && statusFilter !== 'todos') {
            tempOrders = tempOrders.filter(order => order.status === statusFilter);
        }

        // Filtro de Data
        if (dateFilter) {
            tempOrders = tempOrders.filter(order => order.dataPedidoString === dateFilter);
        }

        // Filtro de Busca (Nome ou Email)
        if (searchFilter.length > 2) {
            const lowerSearch = searchFilter.toLowerCase();
            tempOrders = tempOrders.filter(order => 
                order.userName?.toLowerCase().includes(lowerSearch) ||
                order.userEmail?.toLowerCase().includes(lowerSearch)
            );
        }

        setFilteredOrders(tempOrders);
    }, [statusFilter, dateFilter, searchFilter, masterOrderList]);


    // 3. Handler para Mudar o Status (Ação)
    const handleStatusChange = async (orderId, newStatus) => {
        // Atualiza o estado local imediatamente (UI/UX de Excelência)
        const updatedOrders = filteredOrders.map(order => 
            order.id === orderId ? { ...order, status: newStatus } : order
        );
        setFilteredOrders(updatedOrders);
        // Atualiza a master list também
        setMasterOrderList(prevList => prevList.map(order => 
            order.id === orderId ? { ...order, status: newStatus } : order
        ));

        // Envia a atualização para o Firestore
        try {
            const orderRef = doc(db, 'orders', orderId);
            await updateDoc(orderRef, {
                status: newStatus
            });
            toast.success(`Pedido ${orderId.substring(0, 5)}... atualizado para ${newStatus}`);
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            toast.error("Falha ao atualizar o status.");
            // Reverte a mudança local se o Firestore falhar (não implementado aqui)
        }
    };

    if (loading) return <Loading />;

    return (
        <div className={styles.ordersPage}>
            <h1 className={styles.title}>Gerenciamento de Pedidos</h1>
            {error && <p className={styles.error}>{error}</p>}
            
            {/* --- Barra de Filtros --- */}
            <div className={styles.filterBar}>
                <div className={styles.filterGroup}>
                    <label>Filtrar por Status</label>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="todos">Todos os Status</option>
                        <option value="processando">Processando</option>
                        <option value="enviado">Enviado</option>
                        <option value="entregue">Entregue</option>
                        <option value="cancelado">Cancelado</option>
                    </select>
                </div>
                <div className={styles.filterGroup}>
                    <label>Filtrar por Data</label>
                    <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
                </div>
                <div className={styles.filterGroup} style={{flexGrow: 1}}>
                    <label>Buscar por Cliente (Nome ou E-mail)</label>
                    <div className={styles.searchWrapper}>
                        <input type="text" value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} placeholder="Digite 3+ caracteres..." />
                        <FaSearch />
                    </div>
                </div>
            </div>

            {/* --- Tabela de Pedidos --- */}
            <div className={styles.tableWrapper}>
                <table className={styles.ordersTable}>
                    <thead>
                        <tr>
                            <th>ID do Pedido</th>
                            <th>Data</th>
                            <th>Cliente</th>
                            <th>Total</th>
                            <th>Status Atual</th>
                            <th>Mudar Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan="7" className={styles.emptyRow}>Nenhum pedido encontrado com estes filtros.</td>
                            </tr>
                        ) : (
                            filteredOrders.map(order => (
                                <tr key={order.id}>
                                    <td data-label="ID">{order.id.substring(0, 8)}...</td>
                                    <td data-label="Data">{formatDate(order.dataPedido)}</td>
                                    <td data-label="Cliente">
                                        {order.userName || "N/A"}
                                        <small>{order.userEmail}</small>
                                    </td>
                                    <td data-label="Total">{formatCurrency(order.total)}</td>
                                    <td data-label="Status">
                                        <span className={`${styles.statusBadge} ${getStatusClass(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td data-label="Mudar Status">
                                        <select 
                                            value={order.status} 
                                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                            className={styles.statusSelect}
                                        >
                                            {STATUS_OPTIONS.map(opt => (
                                                <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td data-label="Ações">
                                        <Link 
                                            to={`/admin/pedidos/${order.id}`} // Link para a futura página de detalhes
                                            className={styles.actionButton}
                                        >
                                            <FaRegEdit /> Ver/Editar
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminOrders;