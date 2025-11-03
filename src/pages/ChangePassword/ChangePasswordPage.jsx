import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { auth } from '../../firebase/config';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { useAuthStore } from '../../store/useAuthStore';
import Loading from '../../components/ui/Loading/Loading';
import { toast } from 'react-toastify';
import styles from './ChangePasswordPage.module.css';

// --- Esquema de Validação (Zod) ---
const passwordSchema = z.object({
  oldPassword: z.string().min(6, "Senha antiga é obrigatória."),
  newPassword: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres."),
  confirmPassword: z.string()
})
// 1. Verifica se a nova senha e a confirmação são iguais
.refine(data => data.newPassword === data.confirmPassword, {
  message: "As novas senhas não conferem.",
  path: ["confirmPassword"], // Onde o erro deve aparecer
})
// 2. Verifica se a nova senha é diferente da antiga
.refine(data => data.oldPassword !== data.newPassword, {
  message: "A nova senha deve ser diferente da antiga.",
  path: ["newPassword"],
});


const ChangePasswordPage = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [authError, setAuthError] = useState(null); // Erro específico do Firebase
    
    // --- Guarda de Roteamento ---
    const user = useAuthStore((state) => state.user);
    const isAuthReady = useAuthStore((state) => state.isAuthReady);
    const navigate = useNavigate();

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(passwordSchema)
    });

    // --- 1. Guarda de Roteamento ---
    useEffect(() => {
        if (isAuthReady && !user) {
            toast.warn("Você precisa estar logado para alterar sua senha.");
            navigate('/login?redirect=/alterar-senha');
        }
    }, [user, isAuthReady, navigate]);

    // --- 2. Submissão (Salvar) ---
    const onSubmit = async (data) => {
        if (!user) return;
        setIsSubmitting(true);
        setAuthError(null);
        
        try {
            // Passo 1: Obter as credenciais com a senha ANTIGA
            const credential = EmailAuthProvider.credential(user.email, data.oldPassword);
            
            // Passo 2: Reautenticar o usuário
            await reauthenticateWithCredential(user, credential);
            
            // Passo 3: Se a reautenticação deu certo, atualizar a senha
            await updatePassword(user, data.newPassword);

            toast.success("Senha alterada com sucesso!");
            reset(); // Limpa o formulário

        } catch (error) {
            console.error("Erro ao alterar senha: ", error);
            if (error.code === 'auth/wrong-password') {
                setAuthError("A senha antiga está incorreta.");
            } else if (error.code === 'auth/weak-password') {
                setAuthError("A nova senha é muito fraca.");
            } else {
                toast.error("Não foi possível alterar sua senha. Tente novamente.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isAuthReady) {
        return <Loading />;
    }
    
    return (
        <div className={`container ${styles.pageWrapper}`}>
            <h1 className={styles.title}>Alterar Senha de Acesso</h1>

            <div className={styles.formCard}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Senha Antiga */}
                    <div className={styles.formGroup}>
                        <label htmlFor="oldPassword">Senha Antiga</label>
                        <input 
                            id="oldPassword"
                            type="password"
                            {...register("oldPassword")}
                            className={styles.input}
                        />
                        {errors.oldPassword && <span className={styles.error}>{errors.oldPassword.message}</span>}
                    </div>

                    {/* Nova Senha */}
                    <div className={styles.formGroup}>
                        <label htmlFor="newPassword">Nova Senha</label>
                        <input 
                            id="newPassword"
                            type="password"
                            {...register("newPassword")}
                            className={styles.input}
                        />
                        {errors.newPassword && <span className={styles.error}>{errors.newPassword.message}</span>}
                    </div>
                    
                    {/* Confirmar Nova Senha */}
                    <div className={styles.formGroup}>
                        <label htmlFor="confirmPassword">Confirmar Nova Senha</label>
                        <input 
                            id="confirmPassword"
                            type="password"
                            {...register("confirmPassword")}
                            className={styles.input}
                        />
                        {errors.confirmPassword && <span className={styles.error}>{errors.confirmPassword.message}</span>}
                    </div>

                    {/* Exibe erros do Firebase (ex: "Senha antiga incorreta") */}
                    {authError && <span className={styles.authError}>{authError}</span>}

                    <div className={styles.actions}>
                        {/* --- CORREÇÃO APLICADA AQUI --- */}
                        <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                        {/* ------------------------------- */}
                            {isSubmitting ? "Salvando..." : "Alterar Senha"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordPage;