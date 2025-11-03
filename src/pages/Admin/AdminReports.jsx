import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import Loading from '../../components/ui/Loading/Loading';
import { FaFileCsv, FaSpinner, FaChartLine, FaBoxes, FaWarehouse } from 'react-icons/fa';
import * as ReportUtils from '../../utils/reportUtils'; // 1. Importa o motor
import { CSVLink } from 'react-csv'; // 2. Importa o botão de Exportar
import styles from './AdminReports.module.css'; // Novo CSS

// Tipos de Relatório
const REPORT_TYPES = [
    { id: 'sales_summary', name: 'Resumo de Vendas', icon: <FaChartLine /> },
    { id: 'sales_by_product', name: 'Vendas por Produto', icon: <FaBoxes /> },
    { id: 'low_stock', name: 'Relatório de Estoque', icon: <FaWarehouse /> },
    // { id: 'customer_activity', name: 'Atividade de Clientes' }, // (Desabilitado por enquanto)
];

// Helper para formatar a data para o CSV (ex: '2025-11-03')
const getCsvFilename = () => `relatorio_fina_estampa_${new Date().toISOString().split('T')[0]}.csv`;

const AdminReports = () => {
    // --- Estados dos Dados ---
    const [masterData, setMasterData] = useState({ orders: [], products: [], users: [] });
    const [categories, setCategories] = useState([]); // Para o filtro
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Estados dos Filtros ---
    const [activeReport, setActiveReport] = useState('sales_summary');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [searchText, setSearchText] = useState('');

    // --- Estados do Relatório Gerado ---
    const [reportData, setReportData] = useState([]);
    const [reportColumns, setReportColumns] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);

    // --- 1. Busca de Dados Iniciais (Apenas 1 vez) ---
    useEffect(() => {
        const fetchMasterData = async () => {
            setLoading(true);
            setError(null);
            try {
                // (Em produção, limite as buscas de pedidos por data ou use Cloud Functions)
                const ordersRef = collection(db, 'orders');
                const productsRef = collection(db, 'products');
                const categoriesRef = collection(db, 'categories');
                // const usersRef = collection(db, 'users'); // (Necessário para o relatório de clientes)

                const [ordersSnap, productsSnap, categoriesSnap] = await Promise.all([
                    getDocs(query(ordersRef)),
                    getDocs(query(productsRef)),
                    getDocs(query(categoriesRef, orderBy('nome'))),
                ]);

                setMasterData({
                    orders: ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
                    products: productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
                    users: [], // (Desabilitado por enquanto)
                });
                setCategories(categoriesSnap.docs.map(doc => doc.data().nome));

            } catch (err) {
                console.error("Erro ao carregar dados mestre:", err);
                setError("Falha ao carregar dados. Verifique as permissões.");
            } finally {
                setLoading(false);
            }
        };
        fetchMasterData();
    }, []);

    // --- 2. Geração do Relatório ---
    const handleGenerateReport = () => {
        setIsGenerating(true);
        setError(null);
        
        const filters = {
            startDate, endDate, categoryFilter,
            searchText: searchText.trim(),
        };

        try {
            let result = { columns: [], data: [] };
            if (activeReport === 'sales_summary') {
                result = ReportUtils.generateSalesSummary(masterData, filters);
            } else if (activeReport === 'sales_by_product') {
                result = ReportUtils.generateSalesByProduct(masterData, filters);
            } else if (activeReport === 'low_stock') {
                result = ReportUtils.generateStockReport(masterData, filters);
            }
            
            setReportData(result.data);
            setReportColumns(result.columns);
        } catch (err) {
            console.error("Erro ao gerar relatório:", err);
            setError("Erro ao processar o relatório.");
        } finally {
            setIsGenerating(false);
        }
    };

    // --- 3. Renderização da Tabela Dinâmica ---
    const renderReportTable = () => {
        if (isGenerating) return <Loading />;
        if (reportData.length === 0) {
            return <p className={styles.emptyReport}>Nenhum dado encontrado para estes filtros. Clique em "Gerar Relatório".</p>;
        }

        return (
            <div className={styles.tableWrapper}>
                <table className={styles.reportTable}>
                    <thead>
                        <tr>
                            {reportColumns.map(col => <th key={col.key}>{col.label}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map((row, index) => (
                            <tr key={index}>
                                {reportColumns.map(col => (
                                    <td key={col.key} data-label={col.label}>
                                        {/* Formata a moeda para exibição na tela (mas não no CSV) */}
                                        {col.key === 'revenue' ? formatCurrency(parseFloat(row[col.key])) : row[col.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    if (loading) return <Loading />; // Loading inicial da página

    return (
        <div className={styles.reportsPage}>
            {/* --- Coluna da Esquerda (Sidebar de Relatórios) --- */}
            <aside className={styles.sidebar}>
                <h2 className={styles.sidebarTitle}>Relatórios</h2>
                <nav className={styles.sidebarNav}>
                    {REPORT_TYPES.map(report => (
                        <button
                            key={report.id}
                            className={`${styles.navButton} ${activeReport === report.id ? styles.active : ''}`}
                            onClick={() => {
                                setActiveReport(report.id);
                                // Reseta os dados ao trocar de relatório
                                setReportData([]); 
                                setReportColumns([]);
                            }}
                        >
                            {report.icon}
                            <span>{report.name}</span>
                        </button>
                    ))}
                </nav>
            </aside>

            {/* --- Coluna da Direita (Conteúdo) --- */}
            <main className={styles.content}>
                <h1 className={styles.title}>{REPORT_TYPES.find(r => r.id === activeReport).name}</h1>
                
                {/* 1. Barra de Filtros */}
                <div className={styles.filterBar}>
                    <div className={styles.filterGroup}>
                        <label>Data Início</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div className={styles.filterGroup}>
                        <label>Data Fim</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                    
                    {/* Filtros Condicionais */}
                    {activeReport === 'low_stock' && (
                         <div className={styles.filterGroup}>
                            <label>Categoria</label>
                            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                                <option value="">Todas</option>
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                    )}

                    {activeReport !== 'sales_summary' && (
                        <div className={styles.filterGroup}>
                            <label>Buscar (Nome/Email)</label>
                            <input type="text" placeholder="Filtrar por..." value={searchText} onChange={e => setSearchText(e.target.value)} />
                        </div>
                    )}
                    
                    <button className={styles.generateButton} onClick={handleGenerateReport} disabled={isGenerating}>
                        {isGenerating ? <FaSpinner className={styles.spinner} /> : "Gerar Relatório"}
                    </button>
                </div>

                {error && <p className={styles.error}>{error}</p>}

                {/* 2. Área do Relatório (Tabela) */}
                <div className={styles.reportContainer}>
                    <div className={styles.reportHeader}>
                        <h3>Resultados</h3>
                        {reportData.length > 0 && (
                            <CSVLink
                                data={reportData}
                                headers={reportColumns}
                                filename={getCsvFilename()}
                                className={styles.exportButton}
                            >
                                <FaFileCsv /> Exportar CSV
                            </CSVLink>
                        )}
                    </div>
                    {renderReportTable()}
                </div>
            </main>
        </div>
    );
};

export default AdminReports;