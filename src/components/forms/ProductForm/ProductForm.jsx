import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db, storage } from '../../../firebase/config';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import styles from './ProductForm.module.css';

// Esquema de Validação (Código de Alta Qualidade)
const productSchema = z.object({
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  descricao: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres."),
  // Converte a string do input para número
  preco: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive("O preço deve ser positivo.")
  ),
  precoAnterior: z.preprocess(
    (a) => (a === '' ? undefined : parseFloat(z.string().parse(a))),
    z.number().positive("O preço deve ser positivo.").optional()
  ),
  estoque: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().int().min(0, "O estoque não pode ser negativo.")
  ),
  categoria: z.string().min(1, "A categoria é obrigatória."),
});

/**
 * Formulário de Produto (para Criar e Atualizar).
 * - Usa react-hook-form e zod para validação (UI/UX e Qualidade).
 * - Gerencia upload de múltiplas imagens para o Firebase Storage.
 * - Cria (addDoc) ou Atualiza (updateDoc) o produto no Firestore.
 */
const ProductForm = ({ productToEdit, onFormClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const isEditing = !!productToEdit;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(productSchema),
    // Define valores padrão se estiver editando
    defaultValues: {
      nome: productToEdit?.nome || '',
      descricao: productToEdit?.descricao || '',
      preco: productToEdit?.preco || 0,
      precoAnterior: productToEdit?.precoAnterior || '',
      estoque: productToEdit?.estoque || 0,
      categoria: productToEdit?.categoria || '',
    },
  });

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  /**
   * Faz upload das imagens para o Firebase Storage.
   * Retorna um array de URLs das imagens.
   */
  const uploadImages = async (productId) => {
    const imageUrls = [];
    if (selectedFiles.length === 0) return [];

    for (const file of selectedFiles) {
      const storageRef = ref(storage, `products/${productId}/${file.name}`);
      try {
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        imageUrls.push(url);
      } catch (error) {
        console.error("Erro no upload da imagem: ", error);
        throw new Error("Falha ao enviar uma ou mais imagens.");
      }
    }
    return imageUrls;
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setUploadError(null);

    // 1. Validação de Imagens
    if (!isEditing && selectedFiles.length === 0) {
      setUploadError("Você deve enviar pelo menos uma imagem para um novo produto.");
      setIsSubmitting(false);
      return;
    }

    try {
      let productData = { ...data };
      
      if (isEditing) {
        // --- LÓGICA DE ATUALIZAÇÃO ---
        const productId = productToEdit.id;
        
        // Faz upload de NOVAS imagens (se houver)
        const newImageUrls = await uploadImages(productId);
        const allImageUrls = [
          ...(productToEdit.imagens || []), // Mantém imagens antigas
          ...newImageUrls, // Adiciona as novas
        ];
        
        productData.imagens = allImageUrls;
        
        const productRef = doc(db, 'products', productId);
        await updateDoc(productRef, productData);
        
      } else {
        // --- LÓGICA DE CRIAÇÃO ---
        // Cria um ID temporário para a pasta de imagens
        const tempId = doc(collection(db, 'temp')).id; 
        
        // Faz upload das imagens usando o ID temporário
        const imageUrls = await uploadImages(tempId);
        productData.imagens = imageUrls;
        productData.createdAt = serverTimestamp(); // Adiciona data de criação
        
        // Adiciona o documento ao Firestore
        const docRef = await addDoc(collection(db, 'products'), productData);
        
        // (Opcional) Poderíamos renomear a pasta no Storage para o ID real (docRef.id)
        // mas usar o ID temporário é mais simples.
      }
      
      reset();
      onFormClose(); // Fecha o formulário/modal
      
    } catch (error) {
      console.error("Erro ao salvar produto: ", error);
      setUploadError(error.message || "Erro ao salvar o produto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <h2 className={styles.formTitle}>
        {isEditing ? 'Editar Produto' : 'Adicionar Novo Produto'}
      </h2>
      
      {/* Nome e Categoria (lado a lado) */}
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="nome">Nome do Produto</label>
          <input id="nome" {...register("nome")} />
          {errors.nome && <span className={styles.error}>{errors.nome.message}</span>}
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="categoria">Categoria</label>
          <input id="categoria" {...register("categoria")} />
          {errors.categoria && <span className={styles.error}>{errors.categoria.message}</span>}
        </div>
      </div>

      {/* Descrição */}
      <div className={styles.formGroup}>
        <label htmlFor="descricao">Descrição</label>
        <textarea id="descricao" {...register("descricao")} rows="4"></textarea>
        {errors.descricao && <span className={styles.error}>{errors.descricao.message}</span>}
      </div>

      {/* Preços e Estoque (lado a lado) */}
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="preco">Preço (R$)</label>
          <input id="preco" type="number" step="0.01" {...register("preco")} />
          {errors.preco && <span className={styles.error}>{errors.preco.message}</span>}
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="precoAnterior">Preço Anterior (Opcional)</label>
          <input id="precoAnterior" type="number" step="0.01" {...register("precoAnterior")} />
          {errors.precoAnterior && <span className={styles.error}>{errors.precoAnterior.message}</span>}
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="estoque">Estoque</label>
          <input id="estoque" type="number" {...register("estoque")} />
          {errors.estoque && <span className={styles.error}>{errors.estoque.message}</span>}
        </div>
      </div>
      
      {/* Upload de Imagens */}
      <div className={styles.formGroup}>
        <label htmlFor="imagens">Imagens</label>
        <input 
          id="imagens" 
          type="file" 
          multiple 
          onChange={handleFileChange} 
        />
        {/* TODO: Adicionar preview das imagens atuais (para edição) */}
        {uploadError && <span className={styles.error}>{uploadError}</span>}
      </div>

      {/* Ações */}
      <div className={styles.actions}>
        <button type="button" onClick={onFormClose} className={styles.btnCancel} disabled={isSubmitting}>
          Cancelar
        </button>
        <button type="submit" className={styles.btnSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : (isEditing ? 'Atualizar Produto' : 'Criar Produto')}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;