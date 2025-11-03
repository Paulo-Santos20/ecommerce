import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '../../../firebase/config';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';
import styles from './CouponForm.module.css'; // Novo CSS

// Esquema de validação
const couponSchema = z.object({
  code: z.string().min(3, "Código muito curto").transform(val => val.toUpperCase()),
  type: z.enum(['percent', 'fixed'], { errorMap: () => ({ message: "Selecione o tipo." }) }),
  value: z.preprocess(
    (a) => parseFloat(String(a).replace(",", ".")),
    z.number().positive("Valor deve ser positivo")
  ),
  minPurchase: z.preprocess(
    (a) => (a === '' || a === 0 ? 0 : parseFloat(String(a).replace(",", "."))),
    z.number().min(0, "Valor mínimo deve ser 0 ou maior")
  ),
  maxUses: z.preprocess(
    (a) => parseInt(String(a), 10),
    z.number().int().min(0, "Número de usos inválido")
  ),
  expiresAt: z.string().optional().nullable(),
  isActive: z.boolean(),
});

const CouponForm = ({ couponToEdit, onFormClose }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = !!couponToEdit;

    const { register, handleSubmit, control, formState: { errors } } = useForm({
        resolver: zodResolver(couponSchema),
        defaultValues: {
            code: couponToEdit?.code || '',
            type: couponToEdit?.type || 'percent',
            value: couponToEdit?.value || 0,
            minPurchase: couponToEdit?.minPurchase || 0,
            maxUses: couponToEdit?.maxUses || 0, // 0 = ilimitado
            expiresAt: couponToEdit?.expiresAt ? couponToEdit.expiresAt.toDate().toISOString().split('T')[0] : '',
            isActive: couponToEdit?.isActive === undefined ? true : couponToEdit.isActive,
        }
    });

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            // Converte a data (string) de volta para Timestamp (ou null)
            const finalData = {
                ...data,
                expiresAt: data.expiresAt ? Timestamp.fromDate(new Date(data.expiresAt + 'T23:59:59')) : null,
            };

            if (isEditing) {
                const couponRef = doc(db, 'coupons', couponToEdit.id);
                await updateDoc(couponRef, finalData);
                toast.success("Cupom atualizado!");
            } else {
                // Adiciona contagem de usos inicial
                await addDoc(collection(db, 'coupons'), {
                    ...finalData,
                    uses: 0, // Começa com 0 usos
                    createdAt: serverTimestamp()
                });
                toast.success("Cupom criado com sucesso!");
            }
            onFormClose(true); // Fecha e sinaliza para recarregar
        } catch (error) {
            console.error("Erro ao salvar cupom:", error);
            if (error.code === 'permission-denied') {
                toast.error("Erro: Você não tem permissão para esta ação.");
            } else {
                toast.error("Erro ao salvar o cupom.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <h2 className={styles.formTitle}>
                {isEditing ? 'Editar Cupom' : 'Novo Cupom de Desconto'}
            </h2>
            
            <div className={styles.formRow}>
                <div className={styles.formGroup} style={{flex: 2}}>
                    <label htmlFor="code">Código (Ex: BEMVINDO10)</label>
                    <input id="code" {...register("code")} style={{ textTransform: 'uppercase' }} />
                    {errors.code && <span className={styles.error}>{errors.code.message}</span>}
                </div>
                <div className={styles.formGroup} style={{flex: 1}}>
                    <label htmlFor="type">Tipo de Desconto</label>
                    <select id="type" {...register("type")} className={styles.select}>
                        <option value="percent">Porcentagem (%)</option>
                        <option value="fixed">Valor Fixo (R$)</option>
                    </select>
                </div>
                <div className={styles.formGroup} style={{flex: 1}}>
                    <label htmlFor="value">Valor (Ex: 10 ou 10.50)</label>
                    <input id="value" type="number" step="0.01" {...register("value")} />
                    {errors.value && <span className={styles.error}>{errors.value.message}</span>}
                </div>
            </div>

            <div className={styles.formRow}>
                <div className={styles.formGroup}>
                    <label htmlFor="minPurchase">Valor Mínimo da Compra (R$)</label>
                    <input id="minPurchase" type="number" step="0.01" {...register("minPurchase")} />
                    <small>Deixe 0 para sem valor mínimo.</small>
                    {errors.minPurchase && <span className={styles.error}>{errors.minPurchase.message}</span>}
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="maxUses">Número Máximo de Usos</label>
                    <input id="maxUses" type="number" {...register("maxUses")} />
                    <small>Deixe 0 para usos ilimitados.</small>
                    {errors.maxUses && <span className={styles.error}>{errors.maxUses.message}</span>}
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="expiresAt">Data de Expiração (Opcional)</label>
                    <input id="expiresAt" type="date" {...register("expiresAt")} />
                    <small>Deixe em branco para nunca expirar.</small>
                </div>
            </div>
            
            <div className={styles.formGroup}>
                <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => (
                        <label className={styles.checkboxLabel}>
                            <input type="checkbox" {...field} checked={field.value} />
                            Cupom Ativo (pode ser usado)
                        </label>
                    )}
                />
            </div>

            <div className={styles.actions}>
                <button type="button" onClick={() => onFormClose(false)} className={styles.btnCancel} disabled={isSubmitting}>
                    Cancelar
                </button>
                <button type="submit" className={styles.btnSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'Salvando...' : (isEditing ? 'Atualizar Cupom' : 'Criar Cupom')}
                </button>
            </div>
        </form>
    );
};

export default CouponForm;