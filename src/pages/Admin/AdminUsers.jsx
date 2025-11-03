import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db, functions } from '../../firebase/config';
import { collection, query, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useAuthStore } from '../../store/useAuthStore';
import Loading from '../../components/ui/Loading/Loading';
import PermissionModal from '../../components/modal/PermissionModal/PermissionModal'; 
import CreateUserModal from '../../components/modal/CreateUserModal/CreateUserModal';
import { toast } from 'react-toastify';
import { FaEdit, FaSearch, FaUserShield, FaUserCheck, FaPlus, FaSpinner } from 'react-icons/fa';
import styles from './AdminUsers.module.css';
// --- CORREÇÃO AQUI ---
import { ROLE_TEMPLATES } from '../../config/permissions'; // Importa do novo arquivo
// --------------------

// Helpers
const formatLastLogin = (timestamp) => {
    if (!timestamp) return 'Nunca';
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const getRoleClass = (role) => {
    if (role === 'admin') return styles.roleAdmin;
    if (role === 'vendedor') return styles.roleVendedor;
    return styles.roleUser;
};

const AdminUsers = () => {
    const [masterUserList, setMasterUserList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    
    const adminUser = useAuthStore((state) => state.user);
    const navigate = useNavigate();

    // --- Busca de Dados ---
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, orderBy('displayName'));
            
            const querySnapshot = await getDocs(q);
            const fetchedUsers = querySnapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data(),
            }));
            
            setMasterUserList(fetchedUsers);
        } catch (err) {
            console.error("Erro ao buscar usuários:", err);
            setError("Não foi possível carregar os usuários.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (adminUser) fetchData();
    }, [fetchData, adminUser, navigate]);

    // --- Filtro de Busca ---
    const filteredUsers = useMemo(() => {
        if (searchTerm.length < 2) return masterUserList;
        const lowerSearch = searchTerm.toLowerCase();
        return masterUserList.filter(user =>
            user.displayName?.toLowerCase().includes(lowerSearch) ||
            user.email?.toLowerCase().includes(lowerSearch)
        );
    }, [searchTerm, masterUserList]);

    // --- Ações (Modais) ---
    const handleOpenModal = (user) => {
        setSelectedUser(user);
        setIsPermissionModalOpen(true);
    };
    
    const handleCloseModals = () => {
        setIsPermissionModalOpen(false);
        setIsCreateModalOpen(false);
        setSelectedUser(null);
    };

    // Salva as permissões (do Modal de Permissão)
    const handleSavePermissions = async (userId, dataToSave) => {
        setIsSubmitting(true);
        
        if (userId === adminUser.uid && dataToSave.role !== 'admin') {
            toast.error("Você não pode remover seu próprio status de Administrador.");
            setIsSubmitting(false);
            return;
        }
        
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, { 
                role: dataToSave.role,
                permissions: dataToSave.permissions
            });
            
            setMasterUserList(prevList => prevList.map(user => 
                user.uid === userId ? { ...user, ...dataToSave } : user
            ));
            toast.success("Permissões atualizadas!");
            handleCloseModals();
        } catch (error) {
            console.error("Erro ao atualizar permissões:", error);
            toast.error("Falha ao atualizar permissões.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Criação de Usuário (Handler)
    const handleCreateUser = async (data) => {
        setIsSubmitting(true);
        const createNewUser = httpsCallable(functions, 'createNewUser');
        
        // Define as permissões padrão baseadas no 'role'
        const permissions = ROLE_TEMPLATES[data.role] || {}; // <-- Agora 'ROLE_TEMPLATES' está definido
        const dataToSend = { ...data, permissions };

        try {
            const result = await createNewUser(dataToSend);
            
            if (result.data.success) {
                toast.success(`Usuário ${data.email} criado com sucesso!`);
                fetchData(); // Atualiza a lista
                handleCloseModals();
            } else {
                throw new Error(result.data.error || 'Erro desconhecido');
            }
        } catch (error) {
            console.error("Erro ao criar usuário:", error);
            if (error.message.includes('auth/email-already-exists')) {
                toast.error("Este e-mail já está em uso.");
            } else {
                toast.error(`Falha ao criar usuário: ${error.message}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <Loading />;
    if (error) return <p className={styles.error}>{error}</p>;

    return (
        <div className={styles.usersPage}>
            <div className={styles.pageHeader}>
                <h1>Gerenciamento de Usuários</h1>
                <div className={styles.actionsWrapper}>
                    <div className={styles.searchBar}>
                        <input type="text" placeholder="Buscar por nome ou e-mail..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        <FaSearch />
                    </div>
                    <button onClick={() => setIsCreateModalOpen(true)} className={styles.addButton}>
                        <FaPlus /> Adicionar Usuário
                    </button>
                </div>
            </div>

            {isPermissionModalOpen && (
                <PermissionModal
                    user={selectedUser}
                    onClose={handleCloseModals}
                    onSave={handleSavePermissions}
                    isSubmitting={isSubmitting}
                />
            )}

            {isCreateModalOpen && (
                <CreateUserModal
                    onClose={handleCloseModals}
                    onCreate={handleCreateUser}
                    isSubmitting={isSubmitting}
                />
            )}

            <div className={styles.tableWrapper}>
                <table className={styles.adminTable}>
                    <thead>
                        <tr>
                            <th>Usuário</th>
                            <th>E-mail</th>
                            <th>Perfil (Role)</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length === 0 ? (
                            <tr><td colSpan="4" className={styles.emptyRow}>Nenhum usuário encontrado.</td></tr>
                        ) : (
                            filteredUsers.map(user => (
                                <tr key={user.uid}>
                                    <td data-label="Usuário">{user.displayName || '(Sem nome)'}</td>
                                    <td data-label="E-mail">{user.email}</td>
                                    <td data-label="Perfil">
                                        <span className={`${styles.roleBadge} ${getRoleClass(user.role)}`}>
                                            {user.role || 'user'}
                                        </span>
                                    </td>
                                    <td data-label="Ações" className={styles.actionCell}>
                                        <button onClick={() => handleOpenModal(user)} className={styles.editButton}>
                                            <FaUserShield /> Permissões
                                        </button>
                                        <Link 
                                            to={`/admin/usuarios/${user.uid}/auditoria`}
                                            className={styles.auditButton}
                                        >
                                            <FaUserCheck /> Auditoria
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


export default AdminUsers;