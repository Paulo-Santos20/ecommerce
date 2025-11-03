import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../../firebase/config';
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import Loading from '../../components/ui/Loading/Loading';
import { toast } from 'react-toastify';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaToggleOn, FaToggleOff, FaSpinner } from 'react-icons/fa';
import CouponForm from '../../components/forms/CouponForm/CouponForm';
import styles from './AdminCoupons.module.css'; // Novo CSS

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return '...';
    return timestamp.toDate().toLocaleDateString('pt-BR');
};

const AdminCoupons = () => {
    const [masterCouponList, setMasterCouponList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [couponToEdit, setCouponToEdit] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loadingAction, setLoadingAction] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const q = query(collection(db, 'coupons'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const fetchedData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setMasterCouponList(fetchedData);
        } catch (err) {
            console.error("Erro ao buscar cupons:", err);
            setError("Não foi possível carregar os cupons.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredCoupons = useMemo(() => {
        if (!searchTerm) return masterCouponList;
        return masterCouponList.filter(c => c.code.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm, masterCouponList]);

    // --- Ações (CRUD) ---
    const handleAddNew = () => { setCouponToEdit(null); setIsFormVisible(true); };
    const handleEdit = (coupon) => { setCouponToEdit(coupon); setIsFormVisible(true); };
    const handleFormClose = (didSave) => {
        setIsFormVisible(false);
        setCouponToEdit(null);
        if (didSave) fetchData();
    };

    const handleToggleActive = async (coupon) => {
        const newStatus = !coupon.isActive;
        setLoadingAction(coupon.id);
        try {
            const couponRef = doc(db, 'coupons', coupon.id);
            await updateDoc(couponRef, { isActive: newStatus });
            setMasterCouponList(prev => prev.map(c => c.id === coupon.id ? { ...c, isActive: newStatus } : c));
            toast.success(`Cupom ${newStatus ? "ativado" : "desativado"}.`);
        } catch (error) {
            toast.error("Falha ao atualizar status.");
        } finally {
            setLoadingAction(null);
        }
    };
    
    const handleDelete = async (coupon) => {
         if (!window.confirm(`Tem certeza que deseja DELETAR o cupom "${coupon.code}"?`)) return;
         setLoadingAction(coupon.id);
         try {
            const couponRef = doc(db, 'coupons', coupon.id);
            await deleteDoc(couponRef);
            toast.success("Cupom deletado.");
            fetchData();
         } catch (error) {
             toast.error("Erro ao deletar cupom.");
         } finally {
             setLoadingAction(null);
         }
    };

    if (loading) return <Loading />;
    if (error) return <p className={styles.error}>{error}</p>;

    return (
        <div className={styles.adminPage}>
            <div className={styles.pageHeader}>
                <h1>Gerenciamento de Cupons</h1>
                <div className={styles.actionsWrapper}>
                    <div className={styles.searchBar}>
                        <input type="text" placeholder="Buscar por código..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        <FaSearch />
                    </div>
                    <button onClick={handleAddNew} className={styles.addButton}>
                        <FaPlus /> Criar Cupom
                    </button>
                </div>
            </div>

            {isFormVisible && (
                <div className={styles.formOverlay}>
                    <div className={styles.formContainer}>
                        <CouponForm 
                            couponToEdit={couponToEdit}
                            onFormClose={handleFormClose}
                        />
                         <button className={styles.closeModalButton} onClick={() => handleFormClose(false)}>
                            Fechar
                        </button>
                    </div>
                </div>
            )}

            {/* Tabela de Cupons */}
            <div className={styles.tableWrapper}>
                <table className={styles.adminTable}>
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Tipo</th>
                            <th>Valor</th>
                            <th>Uso (Usos / Máx)</th>
                            <th>Expira em</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCoupons.map(coupon => (
                            <tr key={coupon.id}>
                                <td data-label="Código" className={styles.codeCell}>{coupon.code}</td>
                                <td data-label="Tipo">{coupon.type === 'percent' ? 'Porcentagem' : 'Fixo (R$)'}</td>
                                <td data-label="Valor">{coupon.type === 'percent' ? `${coupon.value}%` : formatCurrency(coupon.value)}</td>
                                <td data-label="Uso">{coupon.uses} / {coupon.maxUses === 0 ? 'Ilimitado' : coupon.maxUses}</td>
                                <td data-label="Expira em">{coupon.expiresAt ? formatDate(coupon.expiresAt) : 'Nunca'}</td>
                                <td data-label="Status">
                                    <button 
                                        onClick={() => handleToggleActive(coupon)}
                                        className={`${styles.toggleBtn} ${coupon.isActive ? styles.active : styles.inactive}`}
                                        disabled={loadingAction === coupon.id}
                                    >
                                        {loadingAction === coupon.id ? <FaSpinner className={styles.spinner} /> : (
                                            coupon.isActive ? <FaToggleOn /> : <FaToggleOff />
                                        )}
                                        <span>{coupon.isActive ? "Ativo" : "Inativo"}</span>
                                    </button>
                                </td>
                                <td data-label="Ações" className={styles.actionCell}>
                                    <button onClick={() => handleEdit(coupon)} className={styles.editButton} disabled={loadingAction === coupon.id}><FaEdit /> Editar</button>
                                    <button onClick={() => handleDelete(coupon)} className={styles.deleteButton} disabled={loadingAction === coupon.id}><FaTrash /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminCoupons;