import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../../firebase/config';
import { doc, getDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import Loading from '../../components/ui/Loading/Loading';
import { FaArrowLeft } from 'react-icons/fa';
import styles from './AdminAuditLog.module.css'; // Novo CSS

// Formata a data (similar a outros)
const formatLogDate = (timestamp) => {
    if (!timestamp?.toDate) return '...';
    return timestamp.toDate().toLocaleString('pt-BR');
};

const AdminAuditLog = () => {
    const { userId } = useParams();
    const [user, setUser] = useState(null);
    const [logEntries, setLogEntries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!userId) { setLoading(false); return; }
            
            setLoading(true);
            try {
                // 1. Busca os dados do usuário (para mostrar o nome)
                const userRef = doc(db, 'users', userId);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    setUser(userSnap.data());
                }

                // 2. Busca o log de auditoria (da subcoleção)
                const auditLogRef = collection(db, 'users', userId, 'auditLog');
                const q = query(auditLogRef, orderBy('timestamp', 'desc'));
                const logSnapshot = await getDocs(q);
                
                const logs = logSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setLogEntries(logs);

            } catch (error) {
                console.error("Erro ao buscar log de auditoria:", error);
                // Pode falhar se a subcoleção 'auditLog' não existir
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [userId]);

    if (loading) return <Loading />;

    return (
        <div className={styles.auditPage}>
            <Link to="/admin/usuarios" className={styles.backButton}>
                <FaArrowLeft /> Voltar para Usuários
            </Link>
            
            <h1 className={styles.title}>
                Log de Auditoria
                <small>{user?.displayName || user?.email || userId}</small>
            </h1>

            {/* --- Nota Importante --- */}
            <blockquote className={styles.devNote}>
                <strong>Nota do Desenvolvedor:</strong> Esta página lê da subcoleção 
                `users/{userId}/auditLog`. Para que os dados apareçam, todas as outras 
                funções (ex: `AdminOrders`, `ProductForm`) precisam ser 
                modificadas para salvar um documento nesta subcoleção 
                a cada ação do administrador.
            </blockquote>

            {/* Tabela de Logs */}
            <div className={styles.tableWrapper}>
                <table className={styles.logTable}>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Ação</th>
                            <th>Detalhes (ID do Documento)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logEntries.length === 0 ? (
                            <tr><td colSpan="3" className={styles.emptyRow}>Nenhum registro de auditoria encontrado.</td></tr>
                        ) : (
                            logEntries.map(entry => (
                                <tr key={entry.id}>
                                    <td data-label="Data">{formatLogDate(entry.timestamp)}</td>
                                    <td data-label="Ação">{entry.action}</td>
                                    <td data-label="Detalhes">{entry.docId || 'N/A'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminAuditLog;