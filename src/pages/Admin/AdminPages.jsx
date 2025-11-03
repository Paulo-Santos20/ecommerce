import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../firebase/config';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import Loading from '../../components/ui/Loading/Loading';
import { FaEdit, FaPlus, FaFileAlt } from 'react-icons/fa';
import styles from './AdminPages.module.css'; // Novo CSS

const AdminPages = () => {
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const q = query(collection(db, 'pages'), orderBy('title'));
            const querySnapshot = await getDocs(q);
            const fetchedPages = querySnapshot.docs.map(doc => ({
                id: doc.id, // O ID é o "slug" (ex: "sobre-nos")
                ...doc.data(),
            }));
            setPages(fetchedPages);
        } catch (err) {
            console.error("Erro ao buscar páginas:", err);
            setError("Não foi possível carregar as páginas.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) return <Loading />;
    if (error) return <p className={styles.error}>{error}</p>;

    return (
        <div className={styles.adminPage}>
            <div className={styles.pageHeader}>
                <h1>Gerenciamento de Páginas</h1>
                <Link to="/admin/paginas/nova" className={styles.addButton}>
                    <FaPlus /> Criar Nova Página
                </Link>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.adminTable}>
                    <thead>
                        <tr>
                            <th>Título da Página</th>
                            <th>Slug (URL)</th>
                            <th>Última Modificação</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pages.length === 0 ? (
                            <tr><td colSpan="4" className={styles.emptyRow}>Nenhuma página criada.</td></tr>
                        ) : (
                            pages.map(page => (
                                <tr key={page.id}>
                                    <td data-label="Título">
                                        <FaFileAlt /> {page.title || '(Sem Título)'}
                                    </td>
                                    <td data-label="Slug">/{page.id}</td>
                                    <td data-label="Modificado">
                                        {page.updatedAt ? page.updatedAt.toDate().toLocaleDateString('pt-BR') : 'N/A'}
                                    </td>
                                    <td data-label="Ações">
                                        <Link to={`/admin/paginas/editar/${page.id}`} className={styles.editButton}>
                                            <FaEdit /> Editar
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

export default AdminPages;