import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/config';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import styles from './ReviewList.module.css';
import { FaStar } from 'react-icons/fa';
import Loading from '../Loading/Loading';

// Componente simples para renderizar estrelas (somente leitura)
const ReadOnlyStars = ({ rating }) => (
    <div className={styles.readOnlyStars}>
        {[...Array(5)].map((_, i) => (
            <FaStar key={i} color={i < rating ? "#ffc107" : "#e4e5e9"} />
        ))}
    </div>
);

const ReviewList = ({ productId }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!productId) {
            setLoading(false);
            return;
        }
        
        setLoading(true);
        // Caminho para a subcoleção
        const reviewsRef = collection(db, 'products', productId, 'reviews');
        // Ordena pela mais recente
        const q = query(reviewsRef, orderBy('createdAt', 'desc'));

        // onSnapshot "ouve" em tempo real (melhor que getDocs)
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedReviews = [];
            querySnapshot.forEach((doc) => {
                fetchedReviews.push({ id: doc.id, ...doc.data() });
            });
            setReviews(fetchedReviews);
            setLoading(false);
        }, (error) => {
            console.error("Erro ao buscar avaliações: ", error);
            setLoading(false);
        });

        // Limpa o listener ao desmontar
        return () => unsubscribe();

    }, [productId]); // Re-busca se o ID do produto mudar

    if (loading) {
        return <Loading />;
    }

    if (reviews.length === 0) {
        return <p className={styles.noReviews}>Ainda não há avaliações para este produto. Seja o primeiro!</p>;
    }

    return (
        <div className={styles.reviewList}>
            {reviews.map(review => (
                <div key={review.id} className={styles.reviewItem}>
                    <ReadOnlyStars rating={review.rating} />
                    <h5 className={styles.reviewTitle}>{review.title}</h5>
                    <p className={styles.reviewAuthor}>
                        por <strong>{review.authorName}</strong> em 
                        {/* Converte Timestamp para Data legível */}
                        {review.createdAt ? review.createdAt.toDate().toLocaleDateString('pt-BR') : '...'}
                    </p>
                    <p className={styles.reviewComment}>{review.comment}</p>
                </div>
            ))}
        </div>
    );
};

export default ReviewList;