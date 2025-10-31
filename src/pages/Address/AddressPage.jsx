import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../../firebase/config';
import { collection, query, onSnapshot, addDoc, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { useAuthStore } from '../../store/useAuthStore';
import AddressForm from '../../components/forms/AddressForm/AddressForm'; // Importa o form
import Loading from '../../components/ui/Loading/Loading';
import { toast } from 'react-toastify';
import { FaTrash, FaPlus, FaCheckCircle, FaRegCircle } from 'react-icons/fa';
import styles from './AddressPage.module.css';

const AddressPage = () => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false); // Controla a exibição do form
    
    const user = useAuthStore((state) => state.user);
    const isAuthReady = useAuthStore((state) => state.isAuthReady);
    const navigate = useNavigate();

    // Guarda de Roteamento
    useEffect(() => {
        if (isAuthReady && !user) {
            toast.warn("Você precisa estar logado.");
            navigate('/login?redirect=/enderecos');
        }
    }, [user, isAuthReady, navigate]);

    // Busca os endereços em tempo real
    useEffect(() => {
        if (!user) return; // Só busca se logado

        setLoading(true);
        const addressesRef = collection(db, 'users', user.uid, 'addresses');
        const q = query(addressesRef);

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedAddresses = [];
            querySnapshot.forEach((doc) => {
                fetchedAddresses.push({ id: doc.id, ...doc.data() });
            });
            setAddresses(fetchedAddresses);
            setLoading(false);
        }, (error) => {
            console.error("Erro ao buscar endereços: ", error);
            toast.error("Erro ao carregar endereços.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Handler: Adicionar novo endereço
    const handleAddAddress = async (data) => {
        setIsSubmitting(true);
        try {
            const addressesRef = collection(db, 'users', user.uid, 'addresses');
            // Se for o primeiro endereço, marca como padrão
            const isFirstAddress = addresses.length === 0;
            
            await addDoc(addressesRef, {
                ...data,
                isDefault: isFirstAddress 
            });
            
            toast.success("Endereço salvo com sucesso!");
            setShowForm(false); // Fecha o formulário
        } catch (error) {
            console.error("Erro ao salvar endereço:", error);
            toast.error("Não foi possível salvar o endereço.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handler: Deletar endereço
    const handleDelete = async (addressId) => {
        if (!window.confirm("Tem certeza que deseja excluir este endereço?")) return;

        try {
            const addressRef = doc(db, 'users', user.uid, 'addresses', addressId);
            await deleteDoc(addressRef);
            toast.success("Endereço excluído.");
        } catch (error) {
            console.error("Erro ao excluir endereço:", error);
            toast.error("Erro ao excluir.");
        }
    };

    // Handler: Definir como padrão
    const handleSetDefault = async (addressIdToSet) => {
        try {
            const batch = writeBatch(db);
            const addressesRef = collection(db, 'users', user.uid, 'addresses');
            
            // 1. Remove o 'default' de todos os outros
            addresses.forEach(addr => {
                if (addr.id !== addressIdToSet && addr.isDefault) {
                    const docRef = doc(addressesRef, addr.id);
                    batch.update(docRef, { isDefault: false });
                }
            });
            
            // 2. Define o novo 'default'
            const newDefaultRef = doc(addressesRef, addressIdToSet);
            batch.update(newDefaultRef, { isDefault: true });

            await batch.commit();
            toast.success("Endereço padrão atualizado!");
        } catch (error) {
            console.error("Erro ao definir padrão:", error);
            toast.error("Erro ao definir padrão.");
        }
    };

    if (!isAuthReady || loading) {
        return <Loading />;
    }

    return (
        <div className={`container ${styles.pageWrapper}`}>
            <h1 className={styles.title}>Meus Endereços</h1>
            <p className={styles.subtitle}>Gerencie seus endereços de entrega.</p>
            
            {/* Lista de Endereços Salvos */}
            <div className={styles.addressList}>
                {addresses.length === 0 && !showForm && (
                    <p className={styles.noAddress}>Nenhum endereço cadastrado.</p>
                )}
                {addresses.map(addr => (
                    <div key={addr.id} className={styles.addressCard}>
                        <div className={styles.addressContent}>
                            <div className={styles.cardHeader}>
                                <strong>{addr.apelido}</strong>
                                {addr.isDefault && <span className={styles.defaultBadge}>Padrão</span>}
                            </div>
                            <p>{addr.rua}, {addr.numero} {addr.complemento && `- ${addr.complemento}`}</p>
                            <p>{addr.bairro}, {addr.cidade} - {addr.estado}</p>
                            <p>CEP: {addr.cep}</p>
                        </div>
                        <div className={styles.cardActions}>
                            {!addr.isDefault && (
                                <button onClick={() => handleSetDefault(addr.id)} className={styles.actionBtn}>
                                    <FaRegCircle /> Definir como Padrão
                                </button>
                            )}
                            <button onClick={() => handleDelete(addr.id)} className={`${styles.actionBtn} ${styles.deleteBtn}`}>
                                <FaTrash /> Excluir
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Botão para mostrar o formulário */}
            {!showForm && (
                <button className={styles.showFormButton} onClick={() => setShowForm(true)}>
                    <FaPlus /> Adicionar Novo Endereço
                </button>
            )}

            {/* Formulário de Adição */}
            {showForm && (
                <div className={styles.formContainer}>
                    <h2>Adicionar Novo Endereço</h2>
                    <AddressForm 
                        onSubmit={handleAddAddress}
                        submitText="Salvar Endereço"
                        isSubmitting={isSubmitting}
                    />
                    <button className={styles.cancelButton} onClick={() => setShowForm(false)}>
                        Cancelar
                    </button>
                </div>
            )}
        </div>
    );
};

export default AddressPage;