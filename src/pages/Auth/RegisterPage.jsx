import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { auth, db } from '../../firebase/config';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import styles from './Auth.module.css';

// Esquema de validação de Cadastro
const registerSchema = z.object({
  displayName: z.string().min(3, "O nome é obrigatório."),
  email: z.string().email("E-mail inválido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

const RegisterPage = () => {
  const [authError, setAuthError] = useState(null);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema),
  });

  // Cadastro com E-mail/Senha
  const onSubmit = async (data) => {
    setAuthError(null);
    try {
      // 1. Criar o usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // 2. Atualizar o perfil no Auth (adicionar nome)
      await updateProfile(user, {
        displayName: data.displayName,
      });

      // 3. Criar o documento do usuário no Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        displayName: data.displayName,
        email: data.email,
        endereco: {},
        historicoPedidos: [],
      });

      // TODO: Chamar syncCart() do useCartStore
      navigate('/'); // Redireciona para Home
    } catch (error) {
      console.error("Erro no cadastro:", error);
      if (error.code === 'auth/email-already-in-use') {
        setAuthError("Este e-mail já está em uso.");
      } else {
        setAuthError("Falha ao criar a conta.");
      }
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authContainer}>
        <h1 className={styles.title}>Criar Conta</h1>
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="displayName">Nome</label>
            <input id="displayName" type="text" {...register("displayName")} />
            {errors.displayName && <span className={styles.error}>{errors.displayName.message}</span>}
          </div>

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
            {isSubmitting ? 'Criando...' : 'Cadastrar'}
          </button>
        </form>

        <p className={styles.switchLink}>
          Já tem uma conta? <Link to="/login">Faça login</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;