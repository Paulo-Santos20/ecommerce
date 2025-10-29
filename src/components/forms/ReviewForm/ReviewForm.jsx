import React, { useState, useEffect } from 'react'; // 1. useEffect ADICIONADO AQUI
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db, auth } from '../../../firebase/config'; // Importa auth e db
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthStore } from '../../../store/useAuthStore';
import { toast } from 'react-toastify';
import styles from './ReviewForm.module.css';
import { FaStar } from 'react-icons/fa';

// Esquema de validação
const reviewSchema = z.object({
    rating: z.number().min(1, "Dê uma nota de 1 a 5 estrelas"),
    title: z.string().min(3, "Título muito curto").max(100, "Título muito longo"),
    comment: z.string().min(10, "Comentário muito curto").max(500, "Comentário muito longo"),
});

// Componente simples de Estrelas
const StarRating = ({ rating, setRating }) => {
    const [hover, setHover] = useState(null);
    return (
        <div className={styles.starRating}>
            {[...Array(5)].map((_, index) => {
                const ratingValue = index + 1;
                return (
                    <label key={index}>
                        <input 
                            type="radio" 
                            name="rating" 
                            value={ratingValue} 
                            onClick={() => setRating(ratingValue)}
                        />
                        <FaStar 
                            className={styles.star} 
                            color={ratingValue <= (hover || rating) ? "#ffc107" : "#e4e5e9"}
                            onMouseEnter={() => setHover(ratingValue)}
                            onMouseLeave={() => setHover(null)}
                        />
                    </label>
                );
            })}
        </div>
    );
};

const ReviewForm = ({ productId }) => {
    const [rating, setRating] = useState(0);
    const user = useAuthStore((state) => state.user); // Pega o usuário logado

    const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(reviewSchema)
    });

    // 2. O useEffect que estava causando o erro
    useEffect(() => {
        setValue('rating', rating, { shouldValidate: true });
    }, [rating, setValue]);

    // 3. Lógica de onSubmit COMPLETA
    const onSubmit = async (data) => {
        if (!user) {
            return toast.error("Você precisa estar logado para avaliar.");
        }
        
        // Caminho para a subcoleção: 'products/{productId}/reviews'
        const reviewCollectionRef = collection(db, 'products', productId, 'reviews');
        
        try {
            await addDoc(reviewCollectionRef, {
                ...data,
                authorName: user.displayName || "Usuário Anônimo",
                authorId: user.uid,
                createdAt: serverTimestamp()
            });
            toast.success("Avaliação enviada com sucesso!");
            reset();
            setRating(0);
            // TODO: Adicionar um prop 'onReviewAdded' para atualizar a lista em tempo real
        } catch (error) {
            console.error("Erro ao enviar avaliação: ", error);
            toast.error("Houve um erro ao enviar sua avaliação.");
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className={styles.reviewForm}>
            <h4>Deixe sua Avaliação</h4>
            <div className={styles.formGroup}>
                <label>Sua Nota:</label>
                <StarRating rating={rating} setRating={setRating} />
                {errors.rating && <span className={styles.error}>{errors.rating.message}</span>}
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="title">Título da Avaliação:</label>
                <input id="title" {...register("title")} placeholder="Ex: Incrível!" />
                {errors.title && <span className={styles.error}>{errors.title.message}</span>}
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="comment">Comentário:</label>
                <textarea id="comment" rows="4" {...register("comment")} placeholder="Conte o que você achou do produto..."></textarea>
                {errors.comment && <span className={styles.error}>{errors.comment.message}</span>}
            </div>
            <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Enviar Avaliação"}
            </button>
        </form>
    );
};

export default ReviewForm;