import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../firebase/config';
import { collection, getDocs, query, where, orderBy, limit, getCountFromServer, Timestamp } from 'firebase/firestore';
import Loading from '../../components/ui/Loading/Loading';
import { FaDollarSign, FaClipboardList, FaUsers, FaBoxOpen, FaExclamationCircle, FaFire } from 'react-icons/fa';

// Importações do Chart.js
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import styles from './AdminDashboard.module.css';

// Registro dos componentes do Chart.js
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, 
  Title, Tooltip, Legend, Filler
);

// --- Helpers ---
const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return '...';
    return timestamp.toDate().toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit', year: 'numeric'});
};

/**
 * Processa os dados de pedidos para o formato do gráfico
 */
const processSalesData = (orders) => {
    const labels = []; 
    const salesData = []; 

    const monthlySales = new Map();
    const now = new Date();
    
    // Inicializa os últimos 3 meses no Map
    for (let i = 2; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const monthName = d.toLocaleString('pt-BR', { month: 'long' });
        
        monthlySales.set(key, { name: monthName, total: 0 });
    }

    // Processa os pedidos e soma os totais
    orders.forEach(order => {
        const orderDate = order.dataPedido.toDate();
        const key = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (monthlySales.has(key)) {
            monthlySales.get(key).total += order.total;
        }
    });

    // Converte o Map para os arrays do Chart.js
    monthlySales.forEach(value => {
        labels.push(value.name.charAt(0).toUpperCase() + value.name.slice(1));
        salesData.push(value.total);
    });

    return {
        labels,
        datasets: [{
            label: 'Vendas (R$)',
            data: salesData,
            fill: true,
            backgroundColor: 'rgba(128, 0, 0, 0.1)', // Vinho (transparente)
            borderColor: 'var(--color-primary)', // Vinho
            tension: 0.3,
        }]
    };
};

const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        totalCustomers: 0,
        totalProducts: 0,
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [topSellingProducts, setTopSellingProducts] = useState([]);
    const [salesChartData, setSalesChartData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // --- 1. Busca de Contagens (KPIs) ---
                const productsRef = collection(db, 'products');
                const usersRef = collection(db, 'users');
                const ordersRef = collection(db, 'orders');

                const [productCountSnap, userCountSnap, orderCountSnap] = await Promise.all([
                    getCountFromServer(productsRef),
                    getCountFromServer(usersRef),
                    getCountFromServer(ordersRef),
                ]);

                // --- 2. Busca de Dados de Vendas (para Gráfico e Receita) ---
                const threeMonthsAgo = new Date();
                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                const timestampThreeMonthsAgo = Timestamp.fromDate(threeMonthsAgo);

                const salesQuery = query(
                    ordersRef,
                    where('status', 'in', ['entregue', 'enviado']),
                    where('dataPedido', '>=', timestampThreeMonthsAgo),
                    orderBy('dataPedido', 'asc')
                );
                
                // --- 3. Busca de Pedidos Recentes (Aguardando Processamento) ---
                const recentOrdersQuery = query(
                    ordersRef, 
                    where('status', '==', 'processando'), 
                    orderBy('dataPedido', 'desc'), 
                    limit(5)
                );

                // --- 4. Busca de TODOS os Produtos (Top Vendidos e Estoque Baixo) ---
                const allProductsQuery = query(productsRef);

                // --- CORREÇÃO APLICADA AQUI ---
                // Executa as 3 buscas de dados em paralelo
                const [salesSnapshot, recentOrdersSnap, allProductsSnap] = await Promise.all([
                    getDocs(salesQuery),
                    getDocs(recentOrdersQuery),
                    getDocs(allProductsQuery), // <-- Corrigido de 'allProductsSnap'
                ]);
                // --- FIM DA CORREÇÃO ---

                // --- 5. Processamento dos Dados ---
                let totalRevenue = 0;
                const salesOrders = salesSnapshot.docs.map(doc => {
                    const data = doc.data();
                    totalRevenue += data.total; 
                    return data;
                });
                const chartData = processSalesData(salesOrders);
                setSalesChartData(chartData);

                setRecentOrders(recentOrdersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                
                const allProducts = allProductsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                const sortedBySales = [...allProducts].sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
                setTopSellingProducts(sortedBySales.slice(0, 5));
                
                const lowStock = [];
                allProducts.forEach(product => {
                    let totalStock = 0; let isLow = false;
                    product.variants?.forEach(v => {
                        totalStock += v.stock;
                        if (v.stock < 10) isLow = true;
                    });
                    if (isLow) {
                        lowStock.push({
                            id: product.id, nome: product.nome, totalStock: totalStock,
                            image: product.images?.[product.mainImageIndex || 0] || '' 
                        });
                    }
                });
                setLowStockItems(lowStock.slice(0, 5));
                
                setStats({
                    totalRevenue: totalRevenue,
                    totalOrders: orderCountSnap.data().count,
                    totalCustomers: userCountSnap.data().count,
                    totalProducts: productCountSnap.data().count,
                });

            } catch (err) {
                console.error("Erro ao carregar dashboard:", err);
                setError("Não foi possível carregar os dados. Verifique as permissões e índices do Firestore.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Opções do Gráfico
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Vendas (Entregues/Enviadas) - Últimos 3 Meses', font: { size: 16 } },
        },
    };

    if (loading) return <Loading />;

    return (
        <div className={styles.dashboardPage}>
            <h1 className={styles.title}>Dashboard</h1>
            
            {error && <p className={styles.error}>{error}</p>}
            
            {/* --- 1. Cards de KPI --- */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.cardIcon} style={{backgroundColor: '#e8f5e9'}}><FaDollarSign style={{color: '#1b5e20'}} /></div>
                    <div className={styles.cardInfo}>
                        <span>Receita (Últ. 3 Meses)</span>
                        <strong>{formatCurrency(stats.totalRevenue)}</strong>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.cardIcon} style={{backgroundColor: '#e3f2fd'}}><FaClipboardList style={{color: '#0d47a1'}} /></div>
                    <div className={styles.cardInfo}><span>Total de Pedidos</span><strong>{stats.totalOrders}</strong></div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.cardIcon} style={{backgroundColor: '#fff3e0'}}><FaUsers style={{color: '#e65100'}} /></div>
                    <div className={styles.cardInfo}><span>Total de Clientes</span><strong>{stats.totalCustomers}</strong></div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.cardIcon} style={{backgroundColor: '#f3e5f5'}}><FaBoxOpen style={{color: '#4a148c'}} /></div>
                    <div className={styles.cardInfo}><span>Produtos Cadastrados</span><strong>{stats.totalProducts}</strong></div>
                </div>
            </div>

            {/* --- 2. Gráfico de Vendas --- */}
            <div className={styles.chartContainer}>
                {salesChartData ? (
                    <Line data={salesChartData} options={chartOptions} />
                ) : (
                    <p>Carregando dados do gráfico...</p>
                )}
            </div>

            {/* --- 3. Listas Acionáveis --- */}
            <div className={styles.listsGrid}>
                
                {/* Pedidos Recentes */}
                <div className={styles.listCard}>
                    <h2 className={styles.listTitle}>Novos Pedidos (Status: "Processando")</h2>
                    <div className={styles.listContent}>
                        {recentOrders.length === 0 && <p className={styles.emptyList}>Nenhum pedido novo.</p>}
                        {recentOrders.map(order => (
                            <div key={order.id} className={styles.listItem}>
                                <div className={styles.itemInfo}>
                                    <strong>{order.userName}</strong>
                                    <small>{formatDate(order.dataPedido)} - {formatCurrency(order.total)}</small>
                                </div>
                                <Link to={`/admin/pedidos`} className={styles.actionButton}>Ver Pedido</Link>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mais Comprados */}
                <div className={styles.listCard}>
                    <h2 className={styles.listTitle}><FaFire /> Produtos Mais Comprados</h2>
                    <div className={styles.listContent}>
                        {topSellingProducts.length === 0 && <p className={styles.emptyList}>Nenhuma venda registrada.</p>}
                        {topSellingProducts.map(item => (
                            <div key={item.id} className={styles.listItem}>
                                <img src={item.image} alt={item.nome} className={styles.itemImage} />
                                <div className={styles.itemInfo}>
                                    <strong>{item.nome}</strong>
                                    <small><strong>{item.salesCount || 0}</strong> vendas</small>
                                </div>
                                <Link to={`/admin/produtos`} className={styles.actionButton}>Gerenciar</Link>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Estoque Baixo */}
                <div className={styles.listCard}>
                    <h2 className={styles.listTitle}><FaExclamationCircle /> Estoque Baixo (Variantes &lt; 10)</h2>
                    <div className={styles.listContent}>
                        {lowStockItems.length === 0 && <p className={styles.emptyList}>Nenhum item com estoque baixo.</p>}
                        {lowStockItems.map(item => (
                            <div key={item.id} className={styles.listItem}>
                                <img src={item.image} alt={item.nome} className={styles.itemImage} />
                                <div className={styles.itemInfo}>
                                    <strong>{item.nome}</strong>
                                    <small>Estoque Total: {item.totalStock} un.</small>
                                </div>
                                <Link to={`/admin/produtos`} className={styles.actionButton}>Gerenciar</Link>
                            </div>
                        ))}
                    </div>
                </div>
                
            </div>
        </div>
    );
};

export default AdminDashboard;