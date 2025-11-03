import { Timestamp } from 'firebase/firestore';

/**
 * Motor de Relatórios (Frontend)
 * Processa os dados brutos do Firestore em relatórios acionáveis.
 * Em produção (larga escala), esta lógica deve ser movida para Cloud Functions.
 */

// --- Helpers ---
const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return '...';
    return timestamp.toDate().toLocaleDateString('pt-BR');
};
const parseDateFilter = (dateStr) => {
    // Converte 'YYYY-MM-DD' para um Timestamp do início do dia
    if (!dateStr) return null;
    return Timestamp.fromDate(new Date(dateStr + 'T00:00:00'));
};
// -----------------

/**
 * Filtra a lista principal de pedidos com base nos filtros de UI
 */
const filterOrders = (masterOrders, filters) => {
    const { startDate, endDate, searchText } = filters;
    const start = parseDateFilter(startDate);
    const end = parseDateFilter(endDate);
    
    return masterOrders.filter(order => {
        // 1. Filtro de Data
        if (start && order.dataPedido < start) return false;
        if (end && order.dataPedido > end) return false;

        // 2. Filtro de Texto (Nome ou Email)
        if (searchText) {
            const lowerSearch = searchText.toLowerCase();
            const nameMatch = order.userName?.toLowerCase().includes(lowerSearch);
            const emailMatch = order.userEmail?.toLowerCase().includes(lowerSearch);
            if (!nameMatch && !emailMatch) return false;
        }
        
        return true;
    });
};

/**
 * RELATÓRIO 1: Resumo de Vendas
 */
export const generateSalesSummary = (masterData, filters) => {
    const filteredOrders = filterOrders(masterData.orders, filters);

    // Agrega os dados
    let totalRevenue = 0;
    let totalItemsSold = 0;
    const ordersByStatus = { processando: 0, enviado: 0, entregue: 0, cancelado: 0 };

    filteredOrders.forEach(order => {
        if (order.status === 'entregue' || order.status === 'enviado') {
            totalRevenue += order.total;
        }
        if (ordersByStatus[order.status] !== undefined) {
            ordersByStatus[order.status]++;
        }
        order.itens.forEach(item => {
            totalItemsSold += item.quantity;
        });
    });

    // Formata para a tabela e CSV
    const columns = [
        { label: 'Métrica', key: 'metric' },
        { label: 'Valor', key: 'value' },
    ];
    
    const data = [
        { metric: "Receita Total (de pedidos enviados/entregues)", value: formatCurrency(totalRevenue) },
        { metric: "Total de Pedidos (no período)", value: filteredOrders.length },
        { metric: "Total de Itens Vendidos", value: totalItemsSold },
        { metric: "Pedidos Processando", value: ordersByStatus.processando },
        { metric: "Pedidos Enviados", value: ordersByStatus.enviado },
        { metric: "Pedidos Entregues", value: ordersByStatus.entregue },
        { metric: "Pedidos Cancelados", value: ordersByStatus.cancelado },
    ];

    return { columns, data };
};

/**
 * RELATÓRIO 2: Vendas por Produto
 */
export const generateSalesByProduct = (masterData, filters) => {
    const filteredOrders = filterOrders(masterData.orders, filters);
    const productMap = new Map();

    // 1. Agrega vendas por ID de produto
    filteredOrders.forEach(order => {
        // Conta apenas pedidos pagos
        if (order.status === 'entregue' || order.status === 'enviado' || order.status === 'processando') {
            order.itens.forEach(item => {
                const id = item.productId;
                const current = productMap.get(id) || { unitsSold: 0, revenue: 0 };
                productMap.set(id, {
                    unitsSold: current.unitsSold + item.quantity,
                    revenue: current.revenue + (item.price * item.quantity),
                });
            });
        }
    });

    // 2. Mapeia com dados do produto (nome, categoria)
    const processedData = Array.from(productMap.entries()).map(([productId, sales]) => {
        const product = masterData.products.find(p => p.id === productId);
        return {
            productId,
            name: product?.nome || 'Produto Excluído',
            category: product?.categoria || 'N/A',
            unitsSold: sales.unitsSold,
            revenue: sales.revenue,
        };
    });

    // 3. Ordena por receita
    processedData.sort((a, b) => b.revenue - a.revenue);
    
    // Formata para tabela e CSV
    const columns = [
        { label: 'Produto', key: 'name' },
        { label: 'Categoria', key: 'category' },
        { label: 'Unidades Vendidas', key: 'unitsSold' },
        { label: 'Receita (R$)', key: 'revenue' },
    ];
    
    const data = processedData.map(d => ({
        ...d,
        revenue: d.revenue.toFixed(2) // Formata para CSV
    }));

    return { columns, data };
};

/**
 * RELATÓRIO 3: Relatório de Estoque
 */
export const generateStockReport = (masterData, filters) => {
    const { products } = masterData;
    const { categoryFilter, searchText } = filters;
    
    let processedData = [];

    // Processa todos os produtos e suas variantes
    products.forEach(p => {
        p.variants?.forEach(v => {
            processedData.push({
                id: p.id,
                name: p.nome,
                category: p.categoria,
                variant: `${v.color} / ${v.size}`,
                stock: v.stock,
                price: v.price
            });
        });
    });

    // Aplica filtros de texto (nome) ou categoria
    if (categoryFilter) {
        processedData = processedData.filter(p => p.category === categoryFilter);
    }
    if (searchText) {
        const lowerSearch = searchText.toLowerCase();
        processedData = processedData.filter(p => p.name.toLowerCase().includes(lowerSearch));
    }
    
    // Ordena por estoque (mais baixo primeiro)
    processedData.sort((a, b) => a.stock - b.stock);

    const columns = [
        { label: 'Produto', key: 'name' },
        { label: 'Variante (SKU)', key: 'variant' },
        { label: 'Categoria', key: 'category' },
        { label: 'Estoque Atual', key: 'stock' },
        { label: 'Preço (R$)', key: 'price' },
    ];

    return { columns, data: processedData };
};