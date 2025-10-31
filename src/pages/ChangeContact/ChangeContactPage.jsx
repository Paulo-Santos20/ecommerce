import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db, auth } from '../../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { updateEmail, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useAuthStore } from '../../store/useAuthStore';
import Loading from '../../components/ui/Loading/Loading';
import { toast } from 'react-toastify';
import styles from './ChangeContactPage.module.css'; // Novo CSS

// --- Esquemas de Validação Separados ---
const emailSchema = z.object({
  newEmail: z.string().email("Novo e-mail inválido."),
  password: z.string().min(6, "Senha é obrigatória para alterar o e-mail."),
});

const phoneSchema = z.object({
  telefone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos (Ex: (99) 99999-9999)."),
});

const ChangeContactPage = () => {
    const [loadingEmail, setLoadingEmail] = useState(false);
    const [loadingPhone, setLoadingPhone] = useState(false);
    
    const user = useAuthStore((state) => state.user);
    const isAuthReady = useAuthStore((state) => state.isAuthReady);
    const navigate = useNavigate();

    const { 
        register: registerEmail, 
        handleSubmit: handleSubmitEmail, 
        formState: { errors: emailErrors },
        setError: setEmailError,
        reset: resetEmail,
    } = useForm({ resolver: zodResolver(emailSchema) });

    const { 
        register: registerPhone, 
        handleSubmit: handleSubmitPhone, 
        formState: { errors: phoneErrors },
        reset: resetPhone,
    } = useForm({ resolver: zodResolver(phoneSchema) });

    // Guarda de Roteamento
    if (!isAuthReady) {
        return <Loading />;
    }
    if (!user) {
        navigate('/login?redirect=/alterar-contato');
        return <Loading />;
    }

    // --- Submissão de E-mail ---
    const onEmailSubmit = async (data) => {
        setLoadingEmail(true);
        try {
            // 1. Reautenticar o usuário (Obrigatório para alterar e-mail)
            const credential = EmailAuthProvider.credential(user.email, data.password);
            await reauthenticateWithCredential(user, credential);
            
            // 2. Atualizar o e-mail no Firebase Auth
            await updateEmail(user, data.newEmail);

            // 3. Atualizar o e-mail no Firestore (coleção 'users')
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                email: data.newEmail
            });
            
            toast.success("E-mail atualizado com sucesso! Faça login novamente.");
            resetEmail();
            // Desloga o usuário após a troca de e-mail (boa prática)
            setTimeout(() => auth.signOut(), 2000);
            
        } catch (error) {
            console.error("Erro ao alterar e-mail: ", error);
            if (error.code === 'auth/wrong-password') {
                setEmailError('password', { type: 'manual', message: 'Senha incorreta.' });
            } else if (error.code === 'auth/email-already-in-use') {
                setEmailError('newEmail', { type: 'manual', message: 'Este e-mail já está em uso.' });
            } else {
                toast.error("Não foi possível alterar o e-mail.");
            }
        } finally {
            setLoadingEmail(false);
        }
    };

    // --- Submissão de Telefone ---
    const onPhoneSubmit = async (data) => {
        setLoadingPhone(true);
        try {
            // TODO: Para validar um NÚMERO DE TELEFONE no Firebase Auth,
            // é necessário um fluxo completo de verificação por SMS (OTP)
            // usando RecaptchaVerifier e signInWithPhoneNumber.
            
            // Por enquanto, apenas salvamos o telefone no perfil do *Firestore*.
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                telefone: data.telefone
            });

            toast.success("Telefone salvo no seu perfil com sucesso!");
            resetPhone();
        } catch (error) {
            console.error("Erro ao salvar telefone: ", error);
            toast.error("Não foi possível salvar seu telefone.");
        } finally {
            setLoadingPhone(false);
        }
    };

    return (
        <div className={`container ${styles.pageWrapper}`}>
            <h1 className={styles.title}>Alterar E-mail ou Telefone</h1>

            {/* --- Formulário de E-mail --- */}
            <div className={styles.formCard}>
                <h2>Alterar seu E-mail</h2>
                <p className={styles.description}>
                    Seu e-mail de login atual é <strong>{user.email}</strong>.
                    Por segurança, você deve informar sua senha para alterá-lo.
                </p>
                <form onSubmit={handleSubmitEmail(onEmailSubmit)}>
                    <div className={styles.formGroup}>
                        <label htmlFor="newEmail">Novo E-mail</label>
                        <input id="newEmail" type="email" {...registerEmail("newEmail")} />
                        {emailErrors.newEmail && <span className={styles.error}>{emailErrors.newEmail.message}</span>}
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="password">Sua Senha Atual</label>
                        <input id="password" type="password" {...registerEmail("password")} />
                        {emailErrors.password && <span className={styles.error}>{emailErrors.password.message}</span>}
                    </div>
                    <div className={styles.actions}>
                        <button type="submit" className={styles.submitButton} disabled={loadingEmail}>
                            {loadingEmail ? "Alterando..." : "Alterar E-mail"}
                        </button>
                    </div>
                </form>
            </div>

            {/* --- Formulário de Telefone --- */}
            <div className={styles.formCard}>
                <h2>Alterar seu Telefone</h2>
                <p className={styles.description}>
                    Adicione ou atualize seu número de telefone (usado para contato sobre pedidos).
                </p>
                <form onSubmit={handleSubmitPhone(onPhoneSubmit)}>
                    <div className={styles.formGroup}>
                        <label htmlFor="telefone">Novo Telefone</label>
                        <input id="telefone" {...registerPhone("telefone")} placeholder="(99) 99999-9999" />
                        {phoneErrors.telefone && <span className={styles.error}>{phoneErrors.telefone.message}</span>}
                    </div>
                    <div className={styles.actions}>
                        <button type="submit" className={styles.submitButton} disabled={loadingPhone}>
                            {loadingPhone ? "Salvando..." : "Salvar Telefone"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangeContactPage;