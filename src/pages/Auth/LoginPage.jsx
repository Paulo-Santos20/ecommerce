import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { auth, googleProvider, db } from '../../firebase/config';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { FaGoogle } from 'react-icons/fa';
import styles from './Auth.module.css';

// Esquema de validação de Login
const loginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(1, "A senha é obrigatória."), // Mínimo de 1 só para o login
});

const LoginPage = () => {
  const [authError, setAuthError] = useState(null);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  /**
   * Garante que um usuário (especialmente de login social) tenha um
   * documento na coleção 'users'. (Arquitetura Escalável)
   */
  const ensureUserInFirestore = async (user) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Se não existe, cria o documento
      await setDoc(userRef, {
        displayName: user.displayName || user.email,
        email: user.email,
        endereco: {},
        historicoPedidos: [],
      });
    }
  };

  // Login com E-mail/Senha
  const onSubmit = async (data) => {
    setAuthError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      await ensureUserInFirestore(userCredential.user);
      
      // TODO: Sincronizar carrinho anônimo (localStorage) com o Firestore.
      
      navigate('/loja'); // Redireciona para a loja
    } catch (error) {
      console.error("Erro no login:", error);
      // UI/UX de Excelência: Mensagem clara para o usuário
      setAuthError("E-mail ou senha inválidos. Por favor, tente novamente.");
    }
  };

  // Login com Google
  const handleGoogleLogin = async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await ensureUserInFirestore(result.user);
      
      // TODO: Sincronizar carrinho anônimo (localStorage) com o Firestore.
      
      navigate('/loja'); // Redireciona para a loja
    } catch (error) {
      console.error("Erro no login com Google:", error);
      setAuthError("Falha ao autenticar com o Google. Tente novamente.");
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authContainer}>
        <h1 className={styles.title}>Entrar</h1>
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          
          <div className={styles.formGroup}>
            <label htmlFor="email">E-mail</label>
            <input id="email" type="email" {...register("email")} />
            {errors.email && <span className={styles.validationError}>{errors.email.message}</span>}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="password">Senha</label>
            <input id="password" type="password" {...register("password")} />
            {errors.password && <span className={styles.validationError}>{errors.password.message}</span>}
          </div>

          {authError && <span className={styles.authError}>{authError}</span>}

          <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className={styles.divider}>ou</div>

        <button onClick={handleGoogleLogin} className={`${styles.submitButton} ${styles.googleButton}`} disabled={isSubmitting}>
          <FaGoogle /> Entrar com Google
        </button>

        <p className={styles.switchLink}>
          Não tem uma conta? <Link to="/cadastro">Cadastre-se</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;