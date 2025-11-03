import React from 'react'; // Removido useState (agora é controlado pelo pai)
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FaTimes, FaSpinner } from 'react-icons/fa';
import styles from './CreateUserModal.module.css';

const newUserSchema = z.object({
  displayName: z.string().min(3, "Nome é obrigatório."),
  email: z.string().email("E-mail inválido."),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres."),
  role: z.enum(['user', 'vendedor', 'admin']),
});

// Aceita 'isSubmitting' como prop
const CreateUserModal = ({ onClose, onCreate, isSubmitting }) => {
    
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(newUserSchema),
        defaultValues: { role: 'user' }
    });

    // A função 'onCreate' (vinda do AdminUsers.jsx) agora controla o 'isSubmitting'
    const onSubmit = (data) => {
        onCreate(data);
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}><FaTimes /></button>
                <h2 className={styles.title}>Criar Novo Usuário</h2>
                
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className={styles.formGroup}>
                        <label htmlFor="displayName">Nome Completo</label>
                        <input id="displayName" {...register("displayName")} />
                        {errors.displayName && <span className={styles.error}>{errors.displayName.message}</span>}
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="email">E-mail</label>
                        <input id="email" type="email" {...register("email")} />
                        {errors.email && <span className={styles.error}>{errors.email.message}</span>}
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="password">Senha Provisória</label>
                        <input id="password" type="password" {...register("password")} />
                        {errors.password && <span className={styles.error}>{errors.password.message}</span>}
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="roleSelect">Perfil / Permissão</label>
                        <select id="roleSelect" {...register("role")}>
                            <option value="user">Cliente</option>
                            <option value="vendedor">Vendedor</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={styles.btnCancel}>Cancelar</button>
                        <button type="submit" className={styles.btnSubmit} disabled={isSubmitting}>
                            {isSubmitting ? <FaSpinner className={styles.spinner} /> : "Criar Usuário"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateUserModal;