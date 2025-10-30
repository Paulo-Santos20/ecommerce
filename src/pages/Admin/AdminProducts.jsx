import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuthStore } from '../../store/useAuthStore'; // Importa o Auth Store
import ProductForm from '../../components/forms/ProductForm/ProductForm';
import Loading from '../../components/ui/Loading/Loading';
import { FaEdit, FaTrash, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import styles from './AdminProducts.module.css';

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const ADMIN_UID = import.meta.env.VITE_ADMIN_UID; // Pega o UID do admin do .env

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [productToEdit, setProductToEdit] = useState(null);
    
    // --- GUARDA DE ROTEAMENTO DE ADMIN ---
    const user = useAuthStore((state) => state.user);
    const isAuthReady = useAuthStore((state) => state.isAuthReady);
    const navigate = useNavigate();
    const [isAuthorized, setIsAuthorized] = useState(false); // Flag de autorização

    useEffect(() => {
        if (isAuthReady) {
            if (!user) {
                // Não logado
                navigate('/login?redirect=/admin');
            } else if (user.uid !== ADMIN_UID) {
                // Logado, mas não é admin
                toast.error("Acesso não autorizado.");
                navigate('/');
            } else {
                // Logado e é admin
                setIsAuthorized(true);
            }
        }
    }, [user, isAuthReady, navigate]);
    // --- FIM DA GUARDA ---

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const productsQuery = query(collection(db, 'products'), orderBy('nome'));
            const productsSnapshot = await getDocs(productsQuery);
            const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(productsData);

            const categoriesQuery = query(collection(db, 'categories'), orderBy('nome'));
            const categoriesSnapshot = await getDocs(categoriesQuery);
            const categoriesData = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCategories(categoriesData);
        } catch (err) {
            console.error(err);
            setError("Falha ao carregar dados. Verifique as regras do Firestore.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Só busca os dados se o usuário for autorizado
    useEffect(() => {
        if (isAuthorized) {
            fetchData();
        }
    }, [isAuthorized, fetchData]);

    const handleDelete = async (productId) => { /* ... (inalterado) ... */ };
    const handleEdit = (product) => { /* ... (inalterado) ... */ };
    const handleAddNew = () => { /* ... (inalterado) ... */ };
    const handleFormClose = () => { /* ... (inalterado) ... */ };
    
    // Mostra Loading enquanto o auth é verificado
    if (!isAuthReady || (loading && isAuthorized)) return <Loading />;
    
    // Se não for autorizado (após o auth estar pronto), não mostra nada (já foi redirecionado)
    if (!isAuthorized) return null; 

    if (error) return <p className="container">{error}</p>;

    return (
        <div className="container">
            {/* ... (JSX do AdminProducts inalterado) ... */}
        </div>
    );
};

export default AdminProducts;