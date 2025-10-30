import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed';
import ProductCard from '../../components/ui/ProductCard/ProductCard';
import Loading from '../../components/ui/Loading/Loading';
import styles from './RecentlyViewed.module.css';

const RecentlyViewed = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { viewedProductIds } = useRecentlyViewed(); 

    useEffect(() => {
        if (!viewedProductIds || viewedProductIds.length === 0) {
            setLoading(false);
            setProducts([]); 
            return;
        }
        const fetchViewedProducts = async () => {
            setLoading(true);
            setError(null);
            try {
                const idsToFetch = viewedProductIds.slice(0, 10);
                const productsRef = collection(db, 'products');
                const q = query(productsRef, where(documentId(), 'in', idsToFetch));
                const querySnapshot = await getDocs(q);
                const fetchedProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                const sortedProducts = idsToFetch.map(id => 
                    fetchedProducts.find(p => p.id === id)
                ).filter(Boolean); 

                setProducts(sortedProducts);
            } catch (err) {
                console.error("Erro ao buscar produtos vistos:", err);
                setError("Não foi possível carregar os produtos. Tente novamente.");
            } finally {
                setLoading(false);
            }
        };
        fetchViewedProducts();
    }, [viewedProductIds]);

    if (loading) return <Loading />;

    return (
        <div className={`container ${styles.viewedPage}`}>
            <h1 className={styles.title}>Vistos Recentemente</h1>
            <p className={styles.subtitle}>Os últimos produtos que você visualizou.</p>
            {error && <p className={styles.error}>{error}</p>}
            {products.length === 0 && !loading && (
                <div className={styles.noProducts}>
                    <h2>Você ainda não viu nenhum produto.</h2>
                    <Link to="/loja" className={styles.ctaButton}>Ir para a Loja</Link>
                </div>
            )}
            {products.length > 0 && (
                <div className={styles.productsGrid}>
                    {products.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
};
export default RecentlyViewed;