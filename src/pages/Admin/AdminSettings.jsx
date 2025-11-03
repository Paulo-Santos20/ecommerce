import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { db } from '../../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useSettings } from '../../context/SettingsContext'; 
import Loading from '../../components/ui/Loading/Loading';
import { toast } from 'react-toastify';
import { 
    FaStore, FaPhotoVideo, FaHashtag, FaSpinner, FaPlus, FaTrash, 
    FaArrowUp, FaArrowDown, FaShippingFast, FaMapPin // Importa FaMapPin
} from 'react-icons/fa';
import styles from './AdminSettings.module.css';

const SETTINGS_DOC_ID = 'siteSettings';
const SETTINGS_COLLECTION = 'config';

const AdminSettings = () => {
    const { settings } = useSettings(); 
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, reset, watch, control, formState: { errors } } = useForm({
        defaultValues: settings 
    });

    // Hook para o Slider Principal (Hero)
    const { 
        fields: heroFields, 
        append: appendHeroSlide, 
        remove: removeHeroSlide, 
        move: moveHeroSlide 
    } = useFieldArray({
        control,
        name: "heroSlider"
    });
    
    // Hook para Regras de Frete por Estado
    const { 
        fields: stateCostFields, 
        append: appendStateCost, 
        remove: removeStateCost 
    } = useFieldArray({
        control, name: "shippingRules.stateCosts"
    });

    // Hook para Regras de Frete por Bairro
    const { 
        fields: localCostFields, 
        append: appendLocalCost, 
        remove: removeLocalCost 
    } = useFieldArray({
        control, name: "shippingRules.localNeighborhoods"
    });
    
    // Carrega os dados do Contexto no formulário
    useEffect(() => {
        if (settings && settings.storeName !== "Fina Estampa") { // Checa se não são os defaults
            reset(settings);
            setLoading(false);
        } else {
            // Fallback caso o contexto ainda não tenha carregado (ou o doc não exista)
            const fetchSettingsDoc = async () => {
                const settingsRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
                const docSnap = await getDoc(settingsRef);
                if (docSnap.exists()) {
                    // Mescla os padrões com o que veio do DB
                    reset(prev => ({...prev, ...docSnap.data()}));
                } else {
                    reset(settings); // Usa os padrões do contexto
                }
                setLoading(false);
            };
            fetchSettingsDoc();
        }
    }, [settings, reset]);

    // Submissão
    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            // Garante que os valores de frete sejam números
            data.shippingRules.freeThreshold = parseFloat(data.shippingRules.freeThreshold) || 0;
            data.shippingRules.defaultCost = parseFloat(data.shippingRules.defaultCost) || 0;
            
            data.shippingRules.stateCosts = data.shippingRules.stateCosts.map(rule => ({
                ...rule,
                cost: parseFloat(rule.cost) || 0
            }));
            
            data.shippingRules.localNeighborhoods = data.shippingRules.localNeighborhoods.map(rule => ({
                ...rule,
                cost: parseFloat(rule.cost) || 0
            }));
            
            const settingsRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
            // setDoc com merge:true (Cria o doc se não existir, ou atualiza/mescla)
            await setDoc(settingsRef, data, { merge: true }); 
            toast.success("Configurações da loja salvas com sucesso!");
        } catch (error) {
            console.error("Erro ao salvar configurações:", error);
            toast.error("Falha ao salvar. Verifique as permissões.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <Loading />;

    return (
        <div className={styles.settingsPage}>
            <h1 className={styles.title}>Configurações da Loja</h1>

            <form onSubmit={handleSubmit(onSubmit)}>
                
                {/* --- SEÇÃO 1: Configurações Gerais --- */}
                <fieldset className={styles.formSection}>
                    <legend><FaStore /> Geral</legend>
                    <div className={styles.formGroup}>
                        <label htmlFor="storeName">Nome da Loja</label>
                        <input id="storeName" {...register("storeName", { required: "Nome é obrigatório" })} />
                        {errors.storeName && <span className={styles.error}>{errors.storeName.message}</span>}
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="logoUrl">URL da Logo</label>
                        <input id="logoUrl" {...register("logoUrl")} placeholder="https://.../logo.png" />
                        <small>A logo aparece no topo do site.</small>
                    </div>
                    <div className={styles.formGroup}>
                        <label>Banner Promocional do Topo (Header)</label>
                        <Controller name="promoBar.isEnabled" control={control} render={({ field }) => (
                            <label className={styles.checkboxLabel}>
                                <input type="checkbox" {...field} checked={!!field.value} /> Ativar barra de promoção
                            </label>
                        )} />
                        <input {...register("promoBar.text")} placeholder="Texto da promoção" className={styles.subInput} />
                    </div>
                </fieldset>

                {/* --- SEÇÃO 2: Slider Infinito (Hero) --- */}
                <fieldset className={styles.formSection}>
                    <legend><FaPhotoVideo /> Slider Principal (Homepage)</legend>
                    <div className={styles.fieldArrayWrapper}>
                        {heroFields.map((field, index) => (
                            <div key={field.id} className={styles.fieldArrayItem}>
                                <strong>Slide {index + 1}</strong>
                                <div className={styles.formRow}>
                                    <input {...register(`heroSlider.${index}.imgUrlDesktop`)} placeholder="URL Imagem Desktop (1600x400)" />
                                    <input {...register(`heroSlider.${index}.imgUrlMobile`)} placeholder="URL Imagem Mobile (800x600)" />
                                </div>
                                <input {...register(`heroSlider.${index}.alt`)} placeholder="Texto Alternativo (Alt)" />
                                <input {...register(`heroSlider.${index}.link`)} placeholder="Link de destino (ex: /loja)" />
                                <div className={styles.arrayActions}>
                                    <button type="button" onClick={() => moveHeroSlide(index, index - 1)} disabled={index === 0}><FaArrowUp /></button>
                                    <button type="button" onClick={() => moveHeroSlide(index, index + 1)} disabled={index === heroFields.length - 1}><FaArrowDown /></button>
                                    <button type="button" className={styles.deleteBtn} onClick={() => removeHeroSlide(index)}><FaTrash /></button>
                                </div>
                            </div>
                        ))}
                        <button type="button" className={styles.addButton} onClick={() => appendHeroSlide({ imgUrlDesktop: '', imgUrlMobile: '', alt: '', link: '' })}>
                            <FaPlus /> Adicionar Slide
                        </button>
                    </div>
                </fieldset>

                {/* --- SEÇÃO 3: Banners da Homepage --- */}
                <fieldset className={styles.formSection}>
                    <legend><FaPhotoVideo /> Banners (Meio da Homepage)</legend>
                    <div className={styles.bannerGrid}>
                         <div className={styles.bannerInput}>
                            <strong>Banner 1 (Grande)</strong>
                            <input {...register("homeBanners.banner1_large.imgUrl")} placeholder="URL da Imagem (800x450)" />
                            <input {...register("homeBanners.banner1_large.alt")} placeholder="Texto Alternativo (Alt)" />
                            <input {...register("homeBanners.banner1_large.link")} placeholder="Link de destino (ex: /loja)" />
                        </div>
                        <div className={styles.bannerInput}>
                            <strong>Banner 2 (Pequeno)</strong>
                            <input {...register("homeBanners.banner2_small.imgUrl")} placeholder="URL da Imagem (400x450)" />
                            <input {...register("homeBanners.banner2_small.alt")} placeholder="Texto Alternativo (Alt)" />
                            <input {...register("homeBanners.banner2_small.link")} placeholder="Link de destino" />
                        </div>
                        <div className={styles.bannerInput}>
                            <strong>Banner 3 (Pequeno)</strong>
                            <input {...register("homeBanners.banner3_small.imgUrl")} placeholder="URL da Imagem (400x450)" />
                            <input {...register("homeBanners.banner3_small.alt")} placeholder="Texto Alternativo (Alt)" />
                            <input {...register("homeBanners.banner3_small.link")} placeholder="Link de destino" />
                        </div>
                        <div className={styles.bannerInput}>
                            <strong>Banner 4 (Grande)</strong>
                            <input {...register("homeBanners.banner4_large.imgUrl")} placeholder="URL da Imagem (800x450)" />
                            <input {...register("homeBanners.banner4_large.alt")} placeholder="Texto Alternativo (Alt)" />
                            <input {...register("homeBanners.banner4_large.link")} placeholder="Link de destino" />
                        </div>
                    </div>
                </fieldset>

                {/* --- SEÇÃO 4: Regras de Frete (Geral/Estado) --- */}
                <fieldset className={styles.formSection}>
                    <legend><FaShippingFast /> Regras de Frete (Geral)</legend>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Frete Grátis Acima de (R$)</label>
                            <input type="number" step="0.01" {...register("shippingRules.freeThreshold")} />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Custo Padrão (R$)</label>
                            <input type="number" step="0.01" {...register("shippingRules.defaultCost")} />
                            <small>Usado se o estado/bairro não estiver na lista.</small>
                        </div>
                    </div>
                    
                    <label className={styles.fieldArrayLabel}>Custos por Estado (UF)</label>
                    <div className={styles.fieldArrayWrapper}>
                        {stateCostFields.map((field, index) => (
                            <div key={field.id} className={styles.fieldArrayItemSmall}>
                                <input {...register(`shippingRules.stateCosts.${index}.uf`)} placeholder="UF (ex: SP)" maxLength={2} style={{textTransform: 'uppercase'}} />
                                <input type="number" step="0.01" {...register(`shippingRules.stateCosts.${index}.cost`)} placeholder="Custo (R$)" />
                                <button type="button" className={styles.deleteBtnSmall} onClick={() => removeStateCost(index)}><FaTrash /></button>
                            </div>
                        ))}
                         <button type="button" className={styles.addButton} onClick={() => appendStateCost({ uf: '', cost: 0 })}>
                            <FaPlus /> Adicionar Regra de Estado
                        </button>
                    </div>
                </fieldset>

                {/* --- SEÇÃO 5: Regras de Frete Local (Bairro) --- */}
                <fieldset className={styles.formSection}>
                    <legend><FaMapPin /> Regras de Frete Local (Delivery)</legend>
                    <div className={styles.formGroup}>
                        <label>Nome da Cidade Local</label>
                        <input {...register("shippingRules.localCity")} placeholder="Ex: Vitória de Santo Antão" />
                        <small>Nome exato (sensível a maiúsculas) que a API do CEP retorna.</small>
                    </div>
                    
                    <label className={styles.fieldArrayLabel}>Custos por Bairro (na cidade acima)</label>
                    <div className={styles.fieldArrayWrapper}>
                        {localCostFields.map((field, index) => (
                            <div key={field.id} className={styles.fieldArrayItemSmall}>
                                <input {...register(`shippingRules.localNeighborhoods.${index}.name`)} placeholder="Nome do Bairro (Ex: Matriz)" />
                                <input type="number" step="0.01" {...register(`shippingRules.localNeighborhoods.${index}.cost`)} placeholder="Custo (R$)" />
                                <button type="button" className={styles.deleteBtnSmall} onClick={() => removeLocalCost(index)}><FaTrash /></button>
                            </div>
                        ))}
                         <button type="button" className={styles.addButton} onClick={() => appendLocalCost({ name: '', cost: 0 })}>
                            <FaPlus /> Adicionar Regra de Bairro
                        </button>
                    </div>
                </fieldset>

                {/* --- SEÇÃO 6: Rodapé (Footer) --- */}
                <fieldset className={styles.formSection}>
                    <legend><FaHashtag /> Informações do Rodapé</legend>
                    <div className={styles.formGroup}>
                        <label htmlFor="footerCnpj">CNPJ</label>
                        <input id="footerCnpj" {...register("footerInfo.cnpj")} placeholder="00.000.000/0001-00" />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="footerAddress">Endereço (para o rodapé)</label>
                        <input id="footerAddress" {...register("footerInfo.address")} placeholder="Rua..." />
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Telefone/WhatsApp (Contato)</label>
                            <input {...register("footerInfo.whatsapp")} placeholder="5581999998888" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>E-mail (Contato)</label>
                            <input type="email" {...register("footerInfo.email")} placeholder="contato@finaestampa.com" />
                        </div>
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Instagram URL</label>
                            <input {...register("socialMedia.instagram")} placeholder="https://instagram.com/..." />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Facebook URL</label>
                            <input {...register("socialMedia.facebook")} placeholder="https://facebook.com/..." />
                        </div>
                    </div>
                </fieldset>
                
                {/* Ação de Salvar */}
                <div className={styles.actions}>
                    <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                        {isSubmitting ? <FaSpinner className={styles.spinner} /> : "Salvar Configurações"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminSettings;