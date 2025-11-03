import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { collection, query, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useAuthStore } from '../../store/useAuthStore';
import ProductForm from '../../components/forms/ProductForm/ProductForm';
import Loading from '../../components/ui/Loading/Loading';
import { toast } from 'react-toastify';
import { FaEdit, FaSearch, FaPlus, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import styles from './AdminProducts.module.css'; // Novo CSS

const AdminProducts = () => {
    const [masterProductList, setMasterProductList] = useState([]); // Todos os produtos
    const [categories, setCategories] = useState([]); // Para o formulário
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // --- Estados da UI ---
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [productToEdit, setProductToEdit] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); // Para a busca

    // --- Autenticação (já protegido pelo AdminRoute, mas bom para UI) ---
    const user = useAuthStore((state) => state.user);

    // --- 1. Busca todos os dados (Produtos e Categorias) ---
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const categoriesQuery = query(collection(db, 'categories'), orderBy('nome'));
            const productsQuery = query(collection(db, 'products'), orderBy('nome'));
            
            const [categoriesSnapshot, productsSnapshot] = await Promise.all([
                getDocs(categoriesQuery),
                getDocs(productsQuery)
            ]);

            const categoriesData = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const productsData = productsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Garante que 'isActive' exista, define 'true' como padrão
                isActive: doc.data().isActive === undefined ? true : doc.data().isActive 
            }));
            
            setCategories(categoriesData);
            setMasterProductList(productsData);

        } catch (err) {
            console.error("Erro ao buscar dados:", err);
            setError("Não foi possível carregar os dados. Verifique as permissões.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user, fetchData]);

    // --- 2. Lógica de Busca (Filtro Client-Side) ---
    const filteredProducts = useMemo(() => {
        if (searchTerm.length < 2) {
            return masterProductList; // Retorna tudo se a busca for curta
        }
        const lowerSearch = searchTerm.toLowerCase();
        return masterProductList.filter(product =>
            product.nome.toLowerCase().includes(lowerSearch) ||
            product.categoria.toLowerCase().includes(lowerSearch)
        );
    }, [searchTerm, masterProductList]);

    // --- 3. Ações (CRUD) ---
    const handleAddNew = () => {
        setProductToEdit(null);
        setIsFormVisible(true);
    };

    const handleEdit = (product) => {
        setProductToEdit(product);
        setIsFormVisible(true);
    };

    const handleFormClose = (didSave) => {
        setIsFormVisible(false);
        setProductToEdit(null);
        if (didSave) { // Se o formulário salvou, busca dados novos
            fetchData();
        }
    };

    // --- REQUISITO: Inativar/Ativar Produto ---
    const handleToggleActive = async (product) => {
        const newStatus = !product.isActive;
        const actionText = newStatus ? "ativar" : "inativar";

        if (!window.confirm(`Tem certeza que deseja ${actionText} o produto "${product.nome}"?`)) return;

        // Atualiza a UI imediatamente (UI/UX de Excelência)
        setMasterProductList(prevList => 
            prevList.map(p => 
                p.id === product.id ? { ...p, isActive: newStatus } : p
            )
        );

        try {
            const productRef = doc(db, 'products', product.id);
            await updateDoc(productRef, {
                isActive: newStatus
            });
            toast.success(`Produto ${actionText === "ativar" ? "ativado" : "inativado"}!`);
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            toast.error("Falha ao atualizar o produto.");
            // Reverte a UI em caso de erro
            setMasterProductList(prevList => 
                prevList.map(p => 
                    p.id === product.id ? { ...p, isActive: !newStatus } : p
                )
            );
        }
    };

    if (loading) return <Loading />;
    if (error) return <p className={styles.error}>{error}</p>;

    return (
        <div className={styles.productsPage}>
            {/* Cabeçalho com Título, Busca e Botão de Adicionar */}
            <div className={styles.pageHeader}>
                <h1>Gerenciamento de Produtos</h1>
                <div className={styles.actionsWrapper}>
                    <div className={styles.searchBar}>
                        <input 
                            type="text" 
                            placeholder="Buscar por nome ou categoria..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <FaSearch />
                    </div>
                    <button onClick={handleAddNew} className={styles.addButton}>
                        <FaPlus /> Adicionar Produto
                    </button>
                </div>
            </div>

            {/* O Formulário (Modal) */}
            {isFormVisible && (
                <div className={styles.formOverlay}>
                    <div className={styles.formContainer}>
                        <ProductForm 
                            productToEdit={productToEdit} 
                            categories={categories}
                            // Passa a função de fechar E indica se salvou
                            onFormClose={() => handleFormClose(true)} 
                        />
                         <button className={styles.closeModalButton} onClick={() => handleFormClose(false)}>
                            Fechar
                        </button>
                    </div>
                </div>
            )}

            {/* Tabela de Produtos */}
            <div className={styles.tableWrapper}>
                <table className={styles.productsTable}>
                    <thead>
                        <tr>
                            <th>Imagem</th>
                            <th>Produto</th>
                            <th>Categoria</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan="5" className={styles.emptyRow}>
                                    {searchTerm ? "Nenhum produto encontrado." : "Nenhum produto cadastrado."}
                                </td>
                            </tr>
                        ) : (
                            filteredProducts.map(product => (
                                <tr key={product.id}>
                                    <td data-label="Imagem">
                                        <img 
                                            src={product.images?.[product.mainImageIndex || 0] || 'https://via.placeholder.com/60'}
                                            alt={product.nome}
                                            className={styles.productImage}
                                        />
                                    </td>
                                    <td data-label="Produto">{product.nome}</td>
                                    <td data-label="Categoria">{product.categoria}</td>
                                    <td data-label="Status">
                                        {/* Botão de Ativar/Inativar */}
                                        <button 
                                            onClick={() => handleToggleActive(product)}
                                            className={`${styles.toggleBtn} ${product.isActive ? styles.active : styles.inactive}`}
                                            title={product.isActive ? "Desativar" : "Ativar"}
                                        >
                                            {product.isActive ? <FaToggleOn /> : <FaToggleOff />}
                                            <span>{product.isActive ? "Ativo" : "Inativo"}</span>
                                        </button>
                                    </td>
                                    <td data-label="Ações">
                                        <button onClick={() => handleEdit(product)} className={styles.editButton}>
                                            <FaEdit /> Editar
                                        </button>
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

export default AdminProducts;