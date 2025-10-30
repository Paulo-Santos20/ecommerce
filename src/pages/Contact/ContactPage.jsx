import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../../firebase/config';
import { collection, query, orderBy, onSnapshot, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthStore } from '../../store/useAuthStore';
import Loading from '../../components/ui/Loading/Loading';
import { FaPaperPlane, FaUserCircle, FaStore, FaCommentDots, FaSpinner, FaClock } from 'react-icons/fa';
import { toast } from 'react-toastify';
import styles from './ContactPage.module.css';

// ... (helper formatMessageDate inalterado) ...
const formatMessageDate = (timestamp) => {
    if (!timestamp?.toDate) return '';
    const date = timestamp.toDate();
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('pt-BR');
};

const ContactPage = () => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);

    // --- CORREÇÃO DA GUARDA DE ROTEAMENTO ---
    const user = useAuthStore((state) => state.user);
    const isAuthReady = useAuthStore((state) => state.isAuthReady);
    const navigate = useNavigate();
    // ------------------------------------

    const chatWindowRef = useRef(null);
    const [isTimedOut, setIsTimedOut] = useState(false);
    const inactivityTimer = useRef(null);
    
    // Lógica do Timer de Inatividade
    const resetInactivityTimer = useCallback(() => {
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        inactivityTimer.current = setTimeout(() => {
            setIsTimedOut(true); 
        }, 10 * 60 * 1000); // 10 minutos
    }, []);

    useEffect(() => {
        const activityEvents = ['mousemove', 'keydown', 'click', 'scroll'];
        activityEvents.forEach(event => window.addEventListener(event, resetInactivityTimer));
        resetInactivityTimer();
        return () => {
            if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
            activityEvents.forEach(event => window.removeEventListener(event, resetInactivityTimer));
        };
    }, [resetInactivityTimer]);


    // --- CORREÇÃO DA GUARDA DE ROTEAMENTO ---
    useEffect(() => {
        // 1. Espera o Auth estar pronto
        if (!isAuthReady) {
            return; // Mostra o Loading
        }
        
        // 2. Se estiver pronto E não houver usuário, redireciona
        if (!user) {
            toast.warn("Você precisa estar logado para falar conosco.");
            navigate('/login?redirect=/fale-conosco');
        }
    }, [user, isAuthReady, navigate]);
    // --- FIM DA CORREÇÃO ---

    // Busca mensagens
    useEffect(() => {
        if (!user) return; // Se usuário for nulo (após auth pronto), não busca

        setLoading(true);
        const messagesRef = collection(db, 'conversations', user.uid, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedMessages = [];
            querySnapshot.forEach((doc) => fetchedMessages.push({ id: doc.id, ...doc.data() }));
            setMessages(fetchedMessages);
            setLoading(false);
        }, (error) => {
            console.error("Erro ao buscar mensagens: ", error);
            toast.error("Erro ao carregar seu histórico de mensagens.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]); // Depende apenas do 'user'

    // Scroll para o final
    useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, [messages]);

    // Envio de Mensagem
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !user || isSending) return;
        setIsSending(true);
        const text = newMessage;
        setNewMessage(''); 
        const authorName = user.displayName || user.email || "Usuário";
        const isFirstMessage = messages.length === 0;

        try {
            const userMessagesRef = collection(db, 'conversations', user.uid, 'messages');
            await addDoc(userMessagesRef, {
                text: text, createdAt: serverTimestamp(), author: 'user',
                authorId: user.uid, authorName: authorName
            });
            const convoRef = doc(db, 'conversations', user.uid);
            await setDoc(convoRef, {
                userId: user.uid, userName: authorName, lastMessage: text,
                lastUpdatedAt: serverTimestamp(), isReadByAdmin: false 
            }, { merge: true });

            if (isFirstMessage) {
                await addDoc(userMessagesRef, {
                    text: "Obrigado por sua mensagem! Nossa equipe irá analisar e responderá em breve. Caso seja urgente, entre em contato pelo (99) 99999-9999.",
                    createdAt: serverTimestamp(), author: 'admin', authorName: 'Fina Estampa (Auto-Resposta)'
                });
            }
        } catch (error) {
            console.error("Erro ao enviar mensagem:", error);
            toast.error("Sua mensagem não pôde ser enviada. Tente novamente.");
            setNewMessage(text); 
        } finally {
            setIsSending(false);
        }
    }, [newMessage, user, isSending, messages]);

    // Mostra Loading enquanto o auth não está pronto
    if (!isAuthReady) {
        return <Loading />;
    }

    return (
        <div className={`container ${styles.contactPage}`}>
            <h1 className={styles.title}>Fale com a Loja</h1>
            <p className={styles.subtitle}>
                Olá, {user?.displayName?.split(' ')[0] || user?.email || 'cliente'}! Envie sua dúvida e responderemos aqui mesmo.
            </p>
            <div className={styles.chatContainer}>
                {isTimedOut && (
                    <div className={styles.timeoutOverlay}>
                        <div className={styles.timeoutBox}>
                            <FaClock />
                            <h3>Chat Encerrado</h3>
                            <p>Sua sessão expirou por inatividade.</p>
                            <Link to="/loja" className={styles.timeoutButton}>Voltar para a Loja</Link>
                        </div>
                    </div>
                )}
                <div ref={chatWindowRef} className={styles.chatWindow}>
                    {loading && <Loading />}
                    {!loading && messages.length === 0 && (
                        <div className={styles.emptyChat}>
                            <FaCommentDots />
                            <p>Nenhuma mensagem ainda. Inicie a conversa!</p>
                        </div>
                    )}
                    {messages.map(msg => (
                        <div key={msg.id} className={`${styles.message} ${msg.author === 'user' ? styles.user : styles.admin}`}>
                            <div className={styles.avatar}>
                                {msg.author === 'user' ? <FaUserCircle /> : <FaStore />}
                            </div>
                            <div className={styles.messageContent}>
                                {msg.author === 'admin' && (<strong className={styles.adminName}>{msg.authorName}</strong>)}
                                <p>{msg.text}</p>
                                <span className={styles.timestamp}>{formatMessageDate(msg.createdAt)}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <form onSubmit={handleSubmit} className={styles.formContainer}>
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Digite sua mensagem..." disabled={isSending || isTimedOut} onKeyDown={resetInactivityTimer} />
                    <button type="submit" disabled={isSending || newMessage.trim() === '' || isTimedOut}>
                        {isSending ? <FaSpinner className={styles.spinner} /> : <FaPaperPlane />}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ContactPage;