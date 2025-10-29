import React, { useState } from 'react';
import { db } from '../../../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthStore } from '../../../store/useAuthStore';
import { toast } from 'react-toastify';
import styles from './QuestionForm.module.css';

const QuestionForm = ({ productId }) => {
    const [question, setQuestion] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const user = useAuthStore((state) => state.user);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            return toast.error("Você precisa estar logado para perguntar.");
        }
        if (question.length < 10) {
            return toast.warn("Sua pergunta é muito curta.");
        }

        setIsSubmitting(true);
        // Caminho para a subcoleção: 'products/{productId}/questions'
        const qnaCollectionRef = collection(db, 'products', productId, 'questions');

        try {
            await addDoc(qnaCollectionRef, {
                questionText: question,
                authorName: user.displayName || "Usuário",
                authorId: user.uid,
                createdAt: serverTimestamp(),
                answerText: null, // Resposta do admin começa nula
                answeredAt: null,
            });
            toast.success("Pergunta enviada!");
            setQuestion('');
        } catch (error) {
            console.error("Erro ao enviar pergunta: ", error);
            toast.error("Houve um erro ao enviar sua pergunta.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.questionForm}>
            <h4>Faça sua Pergunta</h4>
            <div className={styles.formGroup}>
                <label htmlFor="question">Sua pergunta será respondida pelo vendedor.</label>
                <textarea 
                    id="question" 
                    rows="3" 
                    placeholder="Digite sua pergunta aqui..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                ></textarea>
            </div>
            <button type="submit" className={styles.submitButton} disabled={isSubmitting || question.length < 10}>
                {isSubmitting ? "Enviando..." : "Enviar Pergunta"}
            </button>
        </form>
    );
};

export default QuestionForm;