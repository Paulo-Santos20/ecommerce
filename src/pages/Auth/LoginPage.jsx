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
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

const LoginPage = () => {
  const [authError, setAuthError] = useState(null);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  // Função para garantir que o usuário existe no Firestore
  const ensureUserInFirestore = async (user) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Se não existe (ex: login social pela 1ª vez), cria o documento
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
      
      // TODO: Chamar syncCart() do useCartStore
      navigate('/'); // Redireciona para Home
    } catch (error) {
      console.error("Erro no login:", error);
      setAuthError("E-mail ou senha inválidos.");
    }
  };

  // Login com Google
  const handleGoogleLogin = async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await ensureUserInFirestore(result.user);
      
      // TODO: Chamar syncCart() do useCartStore
      navigate('/'); // Redireciona para Home
    } catch (error) {
      console.error("Erro no login com Google:", error);
      setAuthError("Falha ao autenticar com o Google.");
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authContainer}>
        <h1 className={styles.title}>Login</h1>
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email">E-mail</label>
            <input id="email" type="email" {...register("email")} />
            {errors.email && <span className={styles.error}>{errors.email.message}</span>}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="password">Senha</label>
            <input id="password" type="password" {...register("password")} />
            {errors.password && <span className={styles.error}>{errors.password.message}</span>}
          </div>

          {authError && <span className={styles.error}>{authError}</span>}

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