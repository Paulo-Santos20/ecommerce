import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FaSpinner } from 'react-icons/fa';
import styles from './AddressForm.module.css'; // Novo CSS

// Esquema de validação do Endereço (Zod)
export const addressSchema = z.object({
  apelido: z.string().min(3, "Dê um apelido (ex: Casa, Trabalho)."),
  cep: z.string().min(8, "CEP inválido. Use 8 números.").max(9, "CEP inválido."),
  rua: z.string().min(3, "Rua é obrigatória."),
  numero: z.string().min(1, "Número é obrigatório."),
  complemento: z.string().optional(),
  bairro: z.string().min(3, "Bairro é obrigatório."),
  cidade: z.string().min(3, "Cidade é obrigatória."),
  estado: z.string().min(2, "UF é obrigatória (ex: PE).").max(2, "Use apenas a sigla (ex: PE)."),
});

/**
 * Componente Reutilizável de Formulário de Endereço
 * - Usado na página de Endereços e no Checkout.
 * - Inclui validação Zod e autocomplete de CEP.
 */
const AddressForm = ({ defaultValues, onSubmit, submitText = "Salvar", isSubmitting = false }) => {
    const [isCepLoading, setIsCepLoading] = useState(false);

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(addressSchema),
        defaultValues: defaultValues || {
            apelido: '', cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: ''
        }
    });

    // Atualiza o formulário se os valores padrão mudarem (ex: ao editar)
    useEffect(() => {
        if (defaultValues) {
            reset(defaultValues);
        }
    }, [defaultValues, reset]);
    
    // Autocomplete do CEP
    const cepValue = watch('cep');
    useEffect(() => {
        const fetchCepData = async (cep) => {
            setIsCepLoading(true);
            try {
                const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`);
                if (!response.ok) throw new Error("CEP não encontrado.");
                const data = await response.json();
                setValue('rua', data.street || '', { shouldValidate: true });
                setValue('bairro', data.neighborhood || '', { shouldValidate: true });
                setValue('cidade', data.city || '', { shouldValidate: true });
                setValue('estado', data.state || '', { shouldValidate: true });
            } catch (error) {
                console.error("Erro ao buscar CEP:", error);
            } finally {
                setIsCepLoading(false);
            }
        };
        const cepLimpo = cepValue?.replace(/\D/g, '');
        if (cepLimpo && cepLimpo.length === 8) {
            fetchCepData(cepLimpo);
        }
    }, [cepValue, setValue]);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className={styles.addressForm}>
            {/* Apelido */}
            <div className={styles.formGroup}>
                <label htmlFor="apelido">Apelido do Endereço (ex: Casa)</label>
                <input id="apelido" {...register("apelido")} />
                {errors.apelido && <span className={styles.error}>{errors.apelido.message}</span>}
            </div>
            {/* CEP */}
            <div className={styles.formGroup}>
                <label htmlFor="cep">CEP</label>
                <div className={styles.cepInputWrapper}>
                    <input id="cep" {...register("cep")} maxLength={9} onChange={(e) => { const formattedCep = e.target.value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2'); setValue('cep', formattedCep, { shouldValidate: true }); }} />
                    {isCepLoading && <FaSpinner className={styles.cepSpinner} />}
                </div>
                {errors.cep && <span className={styles.error}>{errors.cep.message}</span>}
            </div>
            {/* Rua e Número */}
            <div className={styles.formRow}>
                <div className={styles.formGroup} style={{flex: 3}}>
                    <label htmlFor="rua">Rua / Av.</label>
                    <input id="rua" {...register("rua")} />
                    {errors.rua && <span className={styles.error}>{errors.rua.message}</span>}
                </div>
                <div className={styles.formGroup} style={{flex: 1}}>
                    <label htmlFor="numero">Número</label>
                    <input id="numero" {...register("numero")} />
                    {errors.numero && <span className={styles.error}>{errors.numero.message}</span>}
                </div>
            </div>
            {/* Complemento e Bairro */}
            <div className={styles.formRow}>
                <div className={styles.formGroup} style={{flex: 1}}>
                    <label htmlFor="complemento">Complemento (Opcional)</label>
                    <input id="complemento" {...register("complemento")} />
                </div>
                <div className={styles.formGroup} style={{flex: 2}}>
                    <label htmlFor="bairro">Bairro</label>
                    <input id="bairro" {...register("bairro")} />
                    {errors.bairro && <span className={styles.error}>{errors.bairro.message}</span>}
                </div>
            </div>
            {/* Cidade e Estado */}
            <div className={styles.formRow}>
                <div className={styles.formGroup} style={{flex: 3}}>
                    <label htmlFor="cidade">Cidade</label>
                    <input id="cidade" {...register("cidade")} />
                    {errors.cidade && <span className={styles.error}>{errors.cidade.message}</span>}
                </div>
                <div className={styles.formGroup} style={{flex: 1}}>
                    <label htmlFor="estado">UF</label>
                    <input id="estado" {...register("estado")} maxLength={2} />
                    {errors.estado && <span className={styles.error}>{errors.estado.message}</span>}
                </div>
            </div>
            <div className={styles.actions}>
                <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                    {isSubmitting ? "Salvando..." : submitText}
                </button>
            </div>
        </form>
    );
};

export default AddressForm;