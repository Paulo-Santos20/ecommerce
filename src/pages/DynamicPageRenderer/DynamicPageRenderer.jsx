import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom'; // 1. Importa useParams
import { db } from '../../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import Loading from '../../components/ui/Loading/Loading';
import styles from './DynamicPageRenderer.module.css';

/**
 * Renderiza uma página estática (Sobre, FAQ, etc.)
 * buscando seu conteúdo (HTML) do Firestore.
 * ATUALIZADO: Agora busca o slug da URL usando useParams.
 */
const DynamicPageRenderer = () => {
    // 2. Usa useParams para pegar o :slug da URL
    const { slug } = useParams(); 
    
    const [page, setPage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!slug) {
            setError("Página não especificada.");
            setLoading(false);
            return;
        }

        const fetchPage = async () => {
            setLoading(true);
            setError(null);
            try {
                const pageRef = doc(db, 'pages', slug); // Usa o slug da URL
                const docSnap = await getDoc(pageRef);

                if (docSnap.exists()) {
                    setPage(docSnap.data());
                } else {
                    setError(`A página "/${slug}" não foi encontrada.`);
                }
            } catch (err) {
                console.error("Erro ao buscar página:", err);
                setError("Não foi possível carregar a página.");
            } finally {
                setLoading(false);
            }
        };

        fetchPage();
    }, [slug]); // 3. Re-busca se o slug mudar

    if (loading) return <Loading />;
    
    if (error) return (
        <div className={`container ${styles.pageContainer}`}>
            <h1 className={styles.pageTitle}>Erro 404</h1>
            <p className={styles.errorText}>{error}</p>
            <Link to="/" className={styles.backButton}>Voltar à Home</Link>
        </div>
    );

    if (!page) return null;

    return (
        <div className={`container ${styles.pageContainer}`}>
            <h1 className={styles.pageTitle}>{page.title}</h1>
            
            {/* Renderiza o HTML salvo do Firestore */}
            <div 
                className={styles.pageContent}
                dangerouslySetInnerHTML={{ __html: page.content }} 
            />
        </div>
    );
};

export default DynamicPageRenderer;