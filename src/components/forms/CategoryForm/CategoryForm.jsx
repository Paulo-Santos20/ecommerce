import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '../../../firebase/config';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';
import styles from './CategoryForm.module.css'; // Novo CSS

// Esquema de validação simples
const categorySchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres."),
});

const CategoryForm = ({ categoryToEdit, onFormClose }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = !!categoryToEdit;

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            nome: categoryToEdit?.nome || '',
        }
    });

    // Reseta o formulário se o 'categoryToEdit' mudar
    useEffect(() => {
        reset({ nome: categoryToEdit?.nome || '' });
    }, [categoryToEdit, reset]);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            if (isEditing) {
                // --- Atualiza Categoria ---
                const categoryRef = doc(db, 'categories', categoryToEdit.id);
                await updateDoc(categoryRef, {
                    nome: data.nome
                });
                toast.success("Categoria atualizada!");
            } else {
                // --- Cria Nova Categoria ---
                await addDoc(collection(db, 'categories'), {
                    ...data,
                    isActive: true, // Padrão
                    activeProductCount: 0, // Padrão
                    createdAt: serverTimestamp()
                });
                toast.success("Categoria criada!");
            }
            onFormClose(true); // Fecha o formulário e sinaliza para recarregar
        } catch (error) {
            console.error("Erro ao salvar categoria:", error);
            toast.error("Erro ao salvar. Verifique se o nome já existe.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <h2 className={styles.formTitle}>
                {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
            </h2>
            
            <div className={styles.formGroup}>
                <label htmlFor="nome">Nome da Categoria</label>
                <input 
                    id="nome" 
                    {...register("nome")} 
                    placeholder="Ex: Feminino"
                />
                {errors.nome && <span className={styles.error}>{errors.nome.message}</span>}
            </div>

            <div className={styles.actions}>
                <button type="button" onClick={() => onFormClose(false)} className={styles.btnCancel} disabled={isSubmitting}>
                    Cancelar
                </button>
                <button type="submit" className={styles.btnSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar')}
                </button>
            </div>
        </form>
    );
};

export default CategoryForm;