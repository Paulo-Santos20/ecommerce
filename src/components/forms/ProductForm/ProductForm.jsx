import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db, auth } from '../../../firebase/config'; // Importa auth
import { collection, addDoc, doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { FaTrash, FaPlus, FaStar } from 'react-icons/fa';
import { toast } from 'react-toastify';
import styles from './ProductForm.module.css';

// --- Esquemas de Validação ---
const variantSchema = z.object({
  color: z.string().min(1, "Cor obrigatória"),
  size: z.string().min(1, "Tamanho obrigatório"),
  price: z.preprocess(
    (a) => parseFloat(String(a).replace(",", ".")),
    z.number().positive("Preço deve ser positivo")
  ),
  oldPrice: z.preprocess(
    (a) => (a === '' || a === 0 ? 0 : parseFloat(String(a).replace(",", "."))),
    z.number().min(0, "Preço antigo deve ser 0 ou maior").optional()
  ),
  stock: z.preprocess(
    (a) => parseInt(String(a), 10),
    z.number().int().min(0, "Estoque não pode ser negativo")
  ),
});

const productSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres."),
  descricao: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres."),
  categoria: z.string().min(1, "Selecione uma categoria."),
  onSale: z.boolean(),
  offerEndDate: z.string().optional().nullable(),
  images: z.array(z.string().url("Insira uma URL válida.")).min(1, "Adicione pelo menos uma imagem."),
  mainImageIndex: z.number().min(0, "Selecione uma imagem principal."),
  variants: z.array(variantSchema).min(1, "Adicione pelo menos uma variante."),
  isActive: z.boolean(), // Inclui o status
});

// Helper para formatar Timestamp do Firebase para string 'YYYY-MM-DD'
const formatTimestampToInputDate = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate(); 
  return date.toISOString().split('T')[0]; // Formata para YYYY-MM-DD
};

/**
 * Formulário de Produto Completo e Corrigido
 */
const ProductForm = ({ productToEdit, categories, onFormClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const isEditing = !!productToEdit;

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      nome: productToEdit?.nome || '',
      descricao: productToEdit?.descricao || '',
      categoria: productToEdit?.categoria || '',
      onSale: productToEdit?.onSale || false,
      offerEndDate: formatTimestampToInputDate(productToEdit?.offerEndDate),
      images: productToEdit?.images || [],
      mainImageIndex: productToEdit?.mainImageIndex || 0,
      variants: productToEdit?.variants || [{ color: '', size: '', price: 0, oldPrice: 0, stock: 0 }],
      isActive: productToEdit?.isActive === undefined ? true : productToEdit.isActive, // Padrão 'true'
    },
  });

  const isOnSale = watch("onSale");

  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({
    control, name: "images",
  });
  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control, name: "variants",
  });

  const [manualUrl, setManualUrl] = useState("");
  const mainImageIndex = watch("mainImageIndex");

  // Limpa campos de promoção se 'onSale' for desmarcado
  useEffect(() => {
    if (!isOnSale) {
      setValue("offerEndDate", '');
      variantFields.forEach((_, index) => {
        setValue(`variants.${index}.oldPrice`, 0);
      });
    }
  }, [isOnSale, setValue, variantFields]);

  const addImageUrl = () => {
    if (manualUrl.startsWith("http")) {
      appendImage(manualUrl);
      setManualUrl("");
    }
  };

  const setAsMainImage = (index) => {
    setValue("mainImageIndex", index);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setFormError(null);
    
    let finalData = { ...data };

    if (finalData.onSale && finalData.offerEndDate) {
      const endDate = new Date(finalData.offerEndDate + 'T23:59:59');
      finalData.offerEndDate = Timestamp.fromDate(endDate);
    } else {
      finalData.offerEndDate = null; 
    }
    
    // Se não for promoção, zera o 'oldPrice'
    if (!finalData.onSale) {
       finalData.variants = finalData.variants.map(v => ({ ...v, oldPrice: 0 }));
    }

    try {
      if (isEditing) {
        const productRef = doc(db, 'products', productToEdit.id);
        await updateDoc(productRef, finalData);
      } else {
        await addDoc(collection(db, 'products'), {
          ...finalData,
          createdAt: serverTimestamp(),
          salesCount: 0 // Inicia contador de vendas
        });
      }
      
      toast.success(isEditing ? "Produto atualizado!" : "Produto criado com sucesso!");
      reset();
      onFormClose(true); // Passa 'true' para indicar que salvou
      
    } catch (error) {
      console.error("Erro ao salvar produto: ", error);
      setFormError(error.message || "Erro ao salvar o produto.");
      toast.error("Erro ao salvar. Verifique o console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <h2 className={styles.formTitle}>{isEditing ? 'Editar Produto' : 'Adicionar Novo Produto'}</h2>
      
      {/* Nome e Categoria */}
      <div className={styles.formRow}>
        <div className={styles.formGroup} style={{flex: 2}}>
          <label htmlFor="nome">Nome do Produto</label>
          <input id="nome" {...register("nome")} />
          {errors.nome && <span className={styles.error}>{errors.nome.message}</span>}
        </div>
        <div className={styles.formGroup} style={{flex: 1}}>
          <label htmlFor="categoria">Categoria</label>
          <select id="categoria" {...register("categoria")} className={styles.select}>
            <option value="">Selecione...</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.nome}>{cat.nome}</option>
            ))}
          </select>
          {errors.categoria && <span className={styles.error}>{errors.categoria.message}</span>}
        </div>
      </div>

      {/* Descrição */}
      <div className={styles.formGroup}>
        <label htmlFor="descricao">Descrição</label>
        <textarea id="descricao" {...register("descricao")} rows="4"></textarea>
        {errors.descricao && <span className={styles.error}>{errors.descricao.message}</span>}
      </div>
      
      {/* Flag de Promoção e Data */}
      <div className={styles.formRow}>
        <div className={styles.formGroup} style={{flex: 1}}>
          <label>Promoção</label>
          <div className={styles.checkboxGroup}>
            <input id="onSale" type="checkbox" {...register("onSale")} />
            <label htmlFor="onSale">Produto em PROMOÇÃO?</label>
          </div>
        </div>
        
        {isOnSale && (
          <div className={styles.formGroup} style={{flex: 1}}>
            <label htmlFor="offerEndDate">Data de Término (Opcional)</label>
            <input id="offerEndDate" type="date" {...register("offerEndDate")} />
            {errors.offerEndDate && <span className={styles.error}>{errors.offerEndDate.message}</span>}
          </div>
        )}
      </div>

      {/* Gerenciador de Imagens (URL) */}
      <div className={styles.formGroup}>
         <label>Imagens (URLs) e Imagem Principal</label>
        <div className={styles.urlInputGroup}>
          <input type="text" placeholder="Cole uma URL de imagem" value={manualUrl} onChange={(e) => setManualUrl(e.target.value)} />
          <button type="button" onClick={addImageUrl} className={styles.btnAddUrl}>Adicionar</button>
        </div>
        {errors.images && <span className={styles.error}>{errors.images.message || errors.images.root?.message}</span>}
        
        <div className={styles.imagePreviewContainer}>
          {imageFields.map((field, index) => (
            <div key={field.id} className={`${styles.imagePreview} ${mainImageIndex === index ? styles.mainImage : ''}`}>
              <img src={field.value} alt={`Preview ${index}`} />
              <button type="button" className={styles.btnRemoveImage} onClick={() => removeImage(index)}><FaTrash /></button>
              <button type="button" className={styles.btnSetMain} onClick={() => setAsMainImage(index)}>
                <FaStar /> {mainImageIndex === index ? 'Principal' : 'Definir'}
              </button>
            </div>
          ))}
        </div>
        {errors.mainImageIndex && <span className={styles.error}>{errors.mainImageIndex.message}</span>}
      </div>

      {/* Gerenciador de Variantes */}
      <div className={styles.formGroup}>
        <label>Variantes (Cor, Tamanho, Preço, Estoque)</label>
        <div className={`${styles.variantHeader} ${isOnSale ? styles.saleActive : ''}`}>
          <span>Cor</span>
          <span>Tamanho</span>
          <span>Preço {isOnSale ? "(Promo)" : ""}</span>
          {isOnSale && <span>Preço Antigo</span>}
          <span>Estoque</span>
          <span></span>
        </div>
        
        {variantFields.map((field, index) => (
          <div key={field.id} className={`${styles.variantRow} ${isOnSale ? styles.saleActive : ''}`}>
            <input {...register(`variants.${index}.color`)} placeholder="Cor (ex: Vinho)" />
            <input {...register(`variants.${index}.size`)} placeholder="Tamanho (ex: P, 38)" />
            <input {...register(`variants.${index}.price`)} type="number" step="0.01" placeholder="Preço (R$)" />
            
            {isOnSale && (
              <input 
                {...register(`variants.${index}.oldPrice`)} 
                type="number" 
                step="0.01" 
                placeholder="Preço Antigo (R$)" 
                className={styles.oldPriceInput}
              />
            )}
            
            <input {...register(`variants.${index}.stock`)} type="number" placeholder="Estoque" />
            
            {/* --- CORREÇÃO APLICADA AQUI --- */}
            <button type="button" onClick={() => removeVariant(index)} className={styles.btnRemoveVariant}>
              <FaTrash />
            </button>
            {/* ------------------------------- */}
          </div>
        ))}
        {errors.variants && <span className={styles.error}>{errors.variants.message || errors.variants.root?.message}</span>}
        <button type="button" onClick={() => appendVariant({ color: '', size: '', price: 0, oldPrice: 0, stock: 0 })} className={styles.btnAddVariant}>
          <FaPlus /> Adicionar Variante (SKU)
        </button>
      </div>
      
      {formError && <span className={styles.error}>{formError}</span>}
      <div className={styles.actions}>
        <button type="button" onClick={() => onFormClose(false)} className={styles.btnCancel}>Cancelar</button>
        <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar Produto'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;