import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { useAuthStore } from '../../store/useAuthStore';
import Loading from '../../components/ui/Loading/Loading';
import { FaTags, FaBoxOpen, FaBell } from 'react-icons/fa';
import styles from './NotificationsPage.module.css';

// ... (helpers formatNotificationDate, getIcon inalterados) ...
const formatNotificationDate = (timestamp) => {
    if (!timestamp?.toDate) return '...';
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (minutes < 1) return 'agora mesmo';
    if (minutes < 60) return `há ${minutes} min`;
    if (hours < 24) return `há ${hours} h`;
    if (days < 7) return `há ${days} d`;
    return date.toLocaleDateString('pt-BR');
};
const getIcon = (type) => {
    switch (type) {
        case 'order': return <FaBoxOpen />;
        case 'promotion': return <FaTags />;
        default: return <FaBell />;
    }
};

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- CORREÇÃO DA GUARDA DE ROTEAMENTO ---
    const user = useAuthStore((state) => state.user);
    const isAuthReady = useAuthStore((state) => state.isAuthReady);
    const navigate = useNavigate();
    // ------------------------------------

    useEffect(() => {
        // 1. Espera o Auth estar pronto
        if (!isAuthReady) {
          return; // Mostra o Loading
        }
        
        // 2. Se estiver pronto E não houver usuário, redireciona
        if (!user) {
            navigate('/login?redirect=/notificacoes');
            return;
        }

        // 3. Se estiver pronto E logado, busca as notificações
        const fetchNotifications = async () => {
            setLoading(true);
            setError(null);
            try {
                const userNotifsRef = collection(db, 'users', user.uid, 'notifications');
                const userNotifsQuery = query(userNotifsRef, orderBy('createdAt', 'desc'), limit(10));
                
                const storeNotifsRef = collection(db, 'store-notifications');
                const storeNotifsQuery = query(storeNotifsRef, orderBy('createdAt', 'desc'), limit(10));

                const [userNotifsSnapshot, storeNotifsSnapshot] = await Promise.all([
                    getDocs(userNotifsQuery),
                    getDocs(storeNotifsQuery)
                ]);

                const userNotifs = userNotifsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), isRead: doc.data().isRead ?? false }));
                const storeNotifs = storeNotifsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), isRead: true }));

                const allNotifications = [...userNotifs, ...storeNotifs];
                allNotifications.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
                
                setNotifications(allNotifications);

            } catch (err) {
                console.error("Erro ao buscar notificações:", err);
                setError("Não foi possível carregar suas notificações.");
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();

    }, [user, isAuthReady, navigate]); // Adiciona isAuthReady

    // Mostra Loading enquanto o auth (ou as notificações) não está pronto
    if (loading || !isAuthReady) {
        return <Loading />;
    }
    // --- FIM DA CORREÇÃO ---
    
    if (error) { /* ... (render de erro) ... */ }

    return (
        <div className={`container ${styles.notificationsPage}`}>
            <h1 className={styles.title}>Minhas Notificações</h1>
            {error && <p className={styles.error}>{error}</p>}
            {notifications.length === 0 && !loading ? (
                <div className={styles.noNotifications}>
                    <FaBell />
                    <h2>Nenhuma notificação por aqui.</h2>
                    <p>Atualizações sobre seus pedidos e promoções da loja aparecerão aqui.</p>
                    <Link to="/loja" className={styles.ctaButton}>Explorar Loja</Link>
                </div>
            ) : (
                <div className={styles.notificationList}>
                    {notifications.map(notif => (
                        <Link to={notif.link || '#'} key={notif.id} className={`${styles.notificationCard} ${!notif.isRead ? styles.unread : ''}`}>
                            <div className={styles.iconWrapper} data-type={notif.type}>{getIcon(notif.type)}</div>
                            <div className={styles.contentWrapper}>
                                <div className={styles.header}>
                                    <h3 className={styles.notificationTitle}>{notif.title}</h3>
                                    <span className={styles.timestamp}>{formatNotificationDate(notif.createdAt)}</span>
                                </div>
                                <p className={styles.message}>{notif.message}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;