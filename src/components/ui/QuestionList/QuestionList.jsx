import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/config';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import styles from './QuestionList.module.css';
import Loading from '../Loading/Loading';
import { toast } from 'react-toastify';

// Componente interno para o formulário de resposta do Admin
const AdminReplyForm = ({ productId, questionId }) => {
    const [answer, setAnswer] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleReply = async (e) => {
        e.preventDefault();
        if (answer.length < 5) {
            return toast.warn("Resposta muito curta.");
        }
        setIsSubmitting(true);
        
        // Caminho para o documento específico da pergunta
        const questionDocRef = doc(db, 'products', productId, 'questions', questionId);
        
        try {
            await updateDoc(questionDocRef, {
                answerText: answer,
                answeredAt: serverTimestamp()
            });
            toast.success("Resposta enviada!");
        } catch (error) {
            console.error("Erro ao responder: ", error);
            toast.error("Erro ao enviar resposta.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleReply} className={styles.adminReply}>
            <textarea 
                rows="2" 
                placeholder="Responder como Fina Estampa..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
            ></textarea>
            <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Responder"}
            </button>
        </form>
    );
};


const QuestionList = ({ productId, isAdmin }) => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!productId) {
            setLoading(false);
            return;
        }
        
        setLoading(true);
        const qnaRef = collection(db, 'products', productId, 'questions');
        const q = query(qnaRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedQuestions = [];
            querySnapshot.forEach((doc) => {
                fetchedQuestions.push({ id: doc.id, ...doc.data() });
            });
            setQuestions(fetchedQuestions);
            setLoading(false);
        }, (error) => {
            console.error("Erro ao buscar perguntas: ", error);
            setLoading(false);
        });

        return () => unsubscribe();

    }, [productId]);

    if (loading) {
        return <Loading />;
    }

    if (questions.length === 0) {
        return <p className={styles.noQuestions}>Ainda não há perguntas para este produto. Seja o primeiro!</p>;
    }

    return (
        <div className={styles.questionList}>
            {questions.map(qna => (
                <div key={qna.id} className={styles.qnaItem}>
                    <div className={styles.question}>
                        <p className={styles.qText}>{qna.questionText}</p>
                        <span className={styles.qAuthor}>
                            por <strong>{qna.authorName}</strong> em 
                            {qna.createdAt ? qna.createdAt.toDate().toLocaleDateString('pt-BR') : '...'}
                        </span>
                    </div>
                    
                    {/* Se houver resposta, mostre-a */}
                    {qna.answerText && (
                        <div className={styles.answer}>
                            <p className={styles.aText}>{qna.answerText}</p>
                            <span className={styles.aAuthor}>
                                por <strong>Fina Estampa</strong> em 
                                {qna.answeredAt ? qna.answeredAt.toDate().toLocaleDateString('pt-BR') : '...'}
                            </span>
                        </div>
                    )}

                    {/* Se for Admin E não houver resposta, mostre o form de resposta */}
                    {isAdmin && !qna.answerText && (
                        <AdminReplyForm productId={productId} questionId={qna.id} />
                    )}
                </div>
            ))}
        </div>
    );
};

export default QuestionList;