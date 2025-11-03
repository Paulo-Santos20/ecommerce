import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../../firebase/config';
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc, getCountFromServer, where } from 'firebase/firestore';
import Loading from '../../components/ui/Loading/Loading';
import { toast } from 'react-toastify';
// --- CORREÇÃO APLICADA AQUI ---
import { FaEdit, FaTrash, FaPlus, FaSearch, FaToggleOn, FaToggleOff, FaSpinner } from 'react-icons/fa';
// --------------------------------
import styles from './AdminCategories.module.css'; 
import CategoryForm from '../../components/forms/CategoryForm/CategoryForm';

const AdminCategories = () => {
    const [masterCategoryList, setMasterCategoryList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // --- Estados da UI ---
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loadingAction, setLoadingAction] = useState(null); // ID da categoria em ação

    // --- 1. Busca todas as categorias ---
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const categoriesQuery = query(collection(db, 'categories'), orderBy('nome'));
            const categoriesSnapshot = await getDocs(categoriesQuery);
            const categoriesData = categoriesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                isActive: doc.data().isActive === undefined ? true : doc.data().isActive,
            }));
            setMasterCategoryList(categoriesData);
        } catch (err) {
            console.error("Erro ao buscar dados:", err);
            setError("Não foi possível carregar as categorias.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- 2. Lógica de Busca (Filtro Client-Side) ---
    const filteredCategories = useMemo(() => {
        if (searchTerm.length < 2) {
            return masterCategoryList;
        }
        return masterCategoryList.filter(cat =>
            cat.nome.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, masterCategoryList]);

    // --- 3. Verifica se a Categoria tem Produtos Ativos (Lógica de Negócios) ---
    const hasActiveProducts = async (categoryName) => {
        setLoadingAction(categoryName); // Ativa spinner
        try {
            const productsRef = collection(db, 'products');
            const q = query(
                productsRef,
                where('categoria', '==', categoryName),
                where('isActive', '==', true)
            );
            const snapshot = await getCountFromServer(q);
            return snapshot.data().count;
        } catch (error) {
            console.error("Erro ao contar produtos:", error);
            toast.error("Erro ao verificar produtos. Ação cancelada.");
            return -1; // Retorna -1 para indicar erro
        } finally {
            setLoadingAction(null); // Desativa spinner (corrigido: deve ser null)
        }
    };

    // --- 4. Ações (CRUD) ---
    const handleAddNew = () => {
        setCategoryToEdit(null);
        setIsFormVisible(true);
    };

    const handleEdit = (category) => {
        setCategoryToEdit(category);
        setIsFormVisible(true);
    };

    const handleFormClose = (didSave) => {
        setIsFormVisible(false);
        setCategoryToEdit(null);
        if (didSave) fetchData(); // Re-busca se salvou
    };

    // --- 5. Inativar Categoria (com verificação) ---
    const handleToggleActive = async (category) => {
        const newStatus = !category.isActive;
        const actionText = newStatus ? "ativar" : "inativar";
        
        setLoadingAction(category.id); // Define o ID da categoria como 'loading'
        
        if (newStatus === false) { 
            const count = await hasActiveProducts(category.nome);
            if (count > 0) {
                toast.error(`Não é possível ${actionText} "${category.nome}". Há ${count} produto(s) ativo(s) nela.`);
                setLoadingAction(null); // Para o spinner
                return;
            }
            if (count === -1) {
                setLoadingAction(null);
                return; // Erro na contagem
            }
        }

        if (!window.confirm(`Tem certeza que deseja ${actionText} a categoria "${category.nome}"?`)) {
            setLoadingAction(null); // Para o spinner se o usuário cancelar
            return;
        }

        setMasterCategoryList(prev => prev.map(c => c.id === category.id ? { ...c, isActive: newStatus } : c));
        try {
            const categoryRef = doc(db, 'categories', category.id);
            await updateDoc(categoryRef, { isActive: newStatus });
            toast.success(`Categoria ${actionText}a!`);
        } catch (error) {
            toast.error("Falha ao atualizar.");
            setMasterCategoryList(prev => prev.map(c => c.id === category.id ? { ...c, isActive: !newStatus } : c));
        } finally {
            setLoadingAction(null);
        }
    };
    
    // 6. Deletar (com a mesma verificação)
    const handleDelete = async (category) => {
         setLoadingAction(category.id); // Define o ID da categoria como 'loading'
         const count = await hasActiveProducts(category.nome);
         if (count > 0) {
            toast.error(`Não é possível DELETAR "${category.nome}". Há ${count} produto(s) ativo(s) nela.`);
            setLoadingAction(null);
            return;
         }
         if (count === -1) {
            setLoadingAction(null);
            return;
         }

         if (!window.confirm(`PERIGO: Tem certeza que deseja DELETAR PERMANENTEMENTE a categoria "${category.nome}"? Esta ação não pode ser desfeita.`)) {
             setLoadingAction(null);
             return;
         }

         try {
            const categoryRef = doc(db, 'categories', category.id);
            await deleteDoc(categoryRef);
            toast.success("Categoria deletada.");
            fetchData(); // Re-busca a lista
         } catch (error) {
             toast.error("Erro ao deletar categoria.");
         } finally {
             setLoadingAction(null);
         }
    };


    if (loading) return <Loading />;
    if (error) return <p className={styles.error}>{error}</p>;

    return (
        <div className={styles.adminPage}>
            <div className={styles.pageHeader}>
                <h1>Gerenciamento de Categorias</h1>
                <div className={styles.actionsWrapper}>
                    <div className={styles.searchBar}>
                        <input type="text" placeholder="Buscar por nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        <FaSearch />
                    </div>
                    <button onClick={handleAddNew} className={styles.addButton}>
                        <FaPlus /> Adicionar Categoria
                    </button>
                </div>
            </div>

            {isFormVisible && (
                <div className={styles.formOverlay}>
                    <div className={styles.formContainer}>
                        <CategoryForm 
                            categoryToEdit={categoryToEdit}
                            onFormClose={handleFormClose}
                        />
                         <button className={styles.closeModalButton} onClick={() => handleFormClose(false)}>
                            Fechar
                        </button>
                    </div>
                </div>
            )}

            {/* Tabela de Categorias */}
            <div className={styles.tableWrapper}>
                <table className={styles.adminTable}>
                    <thead>
                        <tr>
                            <th>Nome da Categoria</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCategories.length === 0 ? (
                            <tr>
                                <td colSpan="3" className={styles.emptyRow}>
                                    {searchTerm ? "Nenhuma categoria encontrada." : "Nenhuma categoria cadastrada."}
                                </td>
                            </tr>
                        ) : (
                            filteredCategories.map(cat => (
                                <tr key={cat.id}>
                                    <td data-label="Nome">{cat.nome}</td>
                                    <td data-label="Status">
                                        <button 
                                            onClick={() => handleToggleActive(cat)}
                                            className={`${styles.toggleBtn} ${cat.isActive ? styles.active : styles.inactive}`}
                                            title={cat.isActive ? "Desativar" : "Ativar"}
                                            disabled={loadingAction === cat.id || loadingAction === cat.nome} // Checa ambos os tipos de loading
                                        >
                                            {/* Agora FaSpinner está definido */}
                                            {loadingAction === cat.id || loadingAction === cat.nome ? <FaSpinner className={styles.spinner} /> : (
                                                cat.isActive ? <FaToggleOn /> : <FaToggleOff />
                                            )}
                                            <span>{cat.isActive ? "Ativo" : "Inativo"}</span>
                                        </button>
                                    </td>
                                    <td data-label="Ações" className={styles.actionCell}>
                                        <button onClick={() => handleEdit(cat)} className={styles.editButton}>
                                            <FaEdit /> Editar
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(cat)} 
                                            className={styles.deleteButton}
                                            disabled={loadingAction === cat.id || loadingAction === cat.nome}
                                        >
                                            {/* Agora FaSpinner está definido */}
                                            {loadingAction === cat.id || loadingAction === cat.nome ? <FaSpinner className={styles.spinner} /> : <FaTrash />}
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

export default AdminCategories;