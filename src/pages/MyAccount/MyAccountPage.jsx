import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db, auth } from '../../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { useAuthStore } from '../../store/useAuthStore';
import Loading from '../../components/ui/Loading/Loading';
import { toast } from 'react-toastify';
import styles from './MyAccountPage.module.css'; // O CSS será atualizado

// --- REQUISITO 1: Schema Atualizado ---
const personalDataSchema = z.object({
  displayName: z.string().min(3, "Nome deve ter pelo menos 3 caracteres."),
  email: z.string().email(), // Não editável
  cpf: z.string()
    .min(11, "CPF deve ter 11 dígitos.")
    .max(14, "CPF inválido.") 
    .optional().or(z.literal('')),
  dataNascimento: z.string().optional().or(z.literal('')), // Novo campo
});
// 'telefone' foi removido

const MyAccountPage = () => {
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const user = useAuthStore((state) => state.user);
    const isAuthReady = useAuthStore((state) => state.isAuthReady);
    const navigate = useNavigate();

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(personalDataSchema)
    });

    // --- Guarda de Roteamento ---
    useEffect(() => {
        if (isAuthReady) {
            if (!user) {
                toast.warn("Você precisa estar logado para ver seus dados.");
                navigate('/login?redirect=/meus-dados');
            }
        }
    }, [user, isAuthReady, navigate]);

    // --- Busca de Dados ---
    useEffect(() => {
        if (user) {
            setLoading(true);
            const fetchUserData = async () => {
                const userRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(userRef);
                
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    reset({
                        email: user.email,
                        displayName: data.displayName || user.displayName,
                        cpf: data.cpf || '',
                        dataNascimento: data.dataNascimento || '', // Carrega a data salva
                    });
                }
                setLoading(false);
            };
            fetchUserData();
        }
    }, [user, reset]);

    // --- Submissão (Salvar) ---
    const onSubmit = async (data) => {
        if (!user) return;
        setIsSubmitting(true);
        
        try {
            // Atualiza os dados no Firestore
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                displayName: data.displayName,
                cpf: data.cpf,
                dataNascimento: data.dataNascimento, // Salva a data
                // 'telefone' foi removido
            });

            // Atualiza o 'displayName' no Firebase Auth
            if (auth.currentUser && auth.currentUser.displayName !== data.displayName) {
                await updateProfile(auth.currentUser, {
                    displayName: data.displayName
                });
            }
            toast.success("Dados atualizados com sucesso!");
        } catch (error) {
            console.error("Erro ao atualizar dados: ", error);
            toast.error("Não foi possível atualizar seus dados.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isAuthReady || loading) {
        return <Loading />;
    }

    return (
        <div className={`container ${styles.pageWrapper}`}>
            <h1 className={styles.title}>Meus Dados Pessoais</h1>

            <div className={styles.formCard}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* E-mail (Não editável) */}
                    <div className={styles.formGroup}>
                        <label htmlFor="email">E-mail</label>
                        <input 
                            id="email"
                            {...register("email")}
                            readOnly 
                            className={styles.inputReadOnly}
                        />
                        <small>Para alterar seu e-mail, acesse a página "Alterar e-mail ou telefone".</small>
                    </div>

                    {/* Nome Completo */}
                    <div className={styles.formGroup}>
                        <label htmlFor="displayName">Nome Completo</label>
                        <input 
                            id="displayName"
                            {...register("displayName")}
                            className={styles.input}
                        />
                        {errors.displayName && <span className={styles.error}>{errors.displayName.message}</span>}
                    </div>

                    {/* --- REQUISITO: Campos Atualizados --- */}
                    <div className={styles.formRow}>
                        {/* CPF */}
                        <div className={styles.formGroup}>
                            <label htmlFor="cpf">CPF</label>
                            <input 
                                id="cpf"
                                {...register("cpf")}
                                placeholder="111.222.333-44"
                                className={styles.input}
                            />
                            {errors.cpf && <span className={styles.error}>{errors.cpf.message}</span>}
                        </div>
                        {/* Data de Nascimento */}
                        <div className={styles.formGroup}>
                            <label htmlFor="dataNascimento">Data de Nascimento</label>
                            <input 
                                id="dataNascimento"
                                type="date" // Input de data
                                {...register("dataNascimento")}
                                className={styles.input}
                            />
                            {errors.dataNascimento && <span className={styles.error}>{errors.dataNascimento.message}</span>}
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                            {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MyAccountPage;