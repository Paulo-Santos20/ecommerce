import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config'; // Verifique o caminho
import { useCartStore } from '../../store/useCartStore'; // Verifique o caminho
import { useAuthStore } from '../../store/useAuthStore'; // Verifique o caminho
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed'; // 1. IMPORTADO
import { toast } from 'react-toastify';
import { FaHeart, FaShippingFast, FaSpinner, FaStar, FaEdit } from 'react-icons/fa';
import Loading from '../../components/ui/Loading/Loading';
import ProductGallery from '../../components/ui/ProductGallery/ProductGallery';
import Accordion from '../../components/ui/Accordion/Accordion';
import ProductCarousel from '../../components/ui/ProductCarousel/ProductCarousel';
// Importa os placeholders (assumindo que existem)
import ReviewForm from '../../components/forms/ReviewForm/ReviewForm';
import ReviewList from '../../components/ui/ReviewList/ReviewList';
import QuestionForm from '../../components/forms/QuestionForm/QuestionForm';
import QuestionList from '../../components/ui/QuestionList/QuestionList';
import styles from './ProductPage.module.css';

// --- Helpers ---
const formatCurrency = (value) => {
    if (typeof value !== 'number' || isNaN(value)) {
        return 'R$ --,--';
    }
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const isSaleActive = (product) => {
    if (!product?.onSale) return false;
    if (product.onSale && !product.offerEndDate) return true; // Promo permanente
    return product.offerEndDate?.toDate() > new Date(); // Verifica data
};

// Acessa a variável de ambiente no topo do módulo
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

// --- Componente Principal ---
const ProductPage = () => {
    const { id: productId } = useParams();
    const addItemToCart = useCartStore((state) => state.addItem);
    const user = useAuthStore((state) => state.user);
    const { addProduct: addRecentlyViewed } = useRecentlyViewed(); // 2. HOOK ATIVADO

    // Estados
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectionError, setSelectionError] = useState(null);
    const [saleIsActiveState, setSaleIsActiveState] = useState(false);
    const [cep, setCep] = useState('');
    const [shippingInfo, setShippingInfo] = useState(null);
    const [shippingLoading, setShippingLoading] = useState(false);
    const [shippingError, setShippingError] = useState(null);

    // --- Busca de Dados do Produto ---
    useEffect(() => {
        const fetchProduct = async () => {
            if (!productId) { setLoading(false); return; }
            setLoading(true); setError(null); setProduct(null); // Reset
            setSelectedColor(null); setSelectedSize(null); setSelectedVariant(null);
            setSaleIsActiveState(false); setCep(''); setShippingInfo(null);
            setShippingError(null);

            try {
                const docRef = doc(db, 'products', productId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (!data.variants || data.variants.length === 0) {
                        throw new Error("Produto sem variantes cadastradas.");
                    }
                    const fullProduct = { id: docSnap.id, ...data };
                    setProduct(fullProduct);
                    setSaleIsActiveState(isSaleActive(fullProduct));
                    setSelectedColor(data.variants[0].color); // Cor padrão

                    // --- 3. ADICIONADO AQUI ---
                    // Salva o ID deste produto na lista de "vistos recentemente"
                    addRecentlyViewed(docSnap.id);
                    // --------------------------

                } else { setError("Produto não encontrado."); }
            } catch (err) {
                console.error("Erro ao buscar produto:", err);
                setError(`Não foi possível carregar o produto. Detalhe: ${err.message}`);
            } finally { setLoading(false); }
        };
        fetchProduct();
    }, [productId, addRecentlyViewed]); // 4. ADICIONADO À DEPENDÊNCIA

    // --- Memos para Variantes ---
    const availableColors = useMemo(() => {
        if (!product?.variants) return [];
        return [...new Set(product.variants.map(v => v.color))];
    }, [product]);

    const availableSizes = useMemo(() => {
        if (!product?.variants || !selectedColor) return [];
        return product.variants
            .filter(v => v.color === selectedColor)
            .map(v => v.size);
    }, [product, selectedColor]);

    // Atualiza a variante selecionada
    useEffect(() => {
        if (product && selectedColor && selectedSize) {
            const variant = product.variants.find(
                v => v.color === selectedColor && v.size === selectedSize
            );
            setSelectedVariant(variant || null);
            setSelectionError(null);
        } else {
            setSelectedVariant(null);
        }
    }, [product, selectedColor, selectedSize]);

    // --- Handlers ---
    const handleSelectColor = (color) => { setSelectedColor(color); setSelectedSize(null); };
    const handleSelectSize = (size) => { setSelectedSize(size); };
    
    const handleAddToCart = () => {
        setSelectionError(null);
        if (!selectedVariant) { setSelectionError("Por favor, selecione cor e tamanho."); return; }
        if (selectedVariant.stock <= 0) { setSelectionError("Este item está fora de estoque."); return; }
        const cartItemId = `${product.id}-${selectedVariant.color}-${selectedVariant.size}`;
        const itemToAdd = {
            id: cartItemId, productId: product.id, nome: product.nome,
            imagem: product.images?.[product.mainImageIndex || 0] || '',
            price: selectedVariant.price, color: selectedVariant.color, size: selectedVariant.size, quantity: 1
        };
        addItemToCart(itemToAdd, 1);
        toast.success(`${itemToAdd.nome} (${itemToAdd.color} / ${itemToAdd.size}) adicionado!`);
    };
    
    const handleCalculateShipping = async () => {
        if (!cep || cep.replace(/\D/g, '').length !== 8) { setShippingError("CEP inválido. Digite 8 números."); setShippingInfo(null); return; }
        setShippingLoading(true); setShippingError(null); setShippingInfo(null);
        const originCep = '55611010'; const destinationCep = cep.replace(/\D/g, '');
        try {
            const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${destinationCep}`);
            if (!response.ok) throw new Error("CEP não encontrado ou inválido.");
            const data = await response.json();
            let simulatedDistanceKm = Math.floor(Math.random() * (1500 - 50 + 1)) + 50;
            if (data.state === 'PE') simulatedDistanceKm = Math.min(simulatedDistanceKm, 300);
            if (data.city === 'Vitória de Santo Antão') simulatedDistanceKm = 10;
            const shippingCost = simulatedDistanceKm * 1; const estimatedDays = Math.max(1, Math.ceil(simulatedDistanceKm / 100));
            setShippingInfo({ city: data.city, state: data.state, cost: shippingCost, days: estimatedDays });
        } catch (error) { console.error("Erro ao calcular frete:", error); setShippingError(error.message || "Não foi possível calcular o frete."); setShippingInfo(null); }
        finally { setShippingLoading(false); }
    };

    // --- Render Logic ---
    if (loading) return <Loading />;

    if (error) return (
        <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>
            <h1 style={{ color: 'var(--color-primary)', fontSize: '2.4rem' }}>Erro</h1>
            <p style={{ fontSize: '1.6rem', marginBottom: '2rem' }}>{error}</p>
            <Link to="/loja" style={{ fontSize: '1.8rem', textDecoration: 'underline' }}>Voltar para a loja</Link>
        </div>
    );

    if (!product?.variants?.length) return (
        <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>
            <h1 style={{ color: 'var(--color-primary)', fontSize: '2.4rem' }}>Erro</h1>
            <p style={{ fontSize: '1.6rem', marginBottom: '2rem' }}>Dados do produto inválidos ou incompletos.</p>
            <Link to="/loja" style={{ fontSize: '1.8rem', textDecoration: 'underline' }}>Voltar para a loja</Link>
        </div>
    );

    // --- Cálculo de Preços (após as verificações) ---
    const displayPrice = selectedVariant ? selectedVariant.price : (product.variants[0]?.price ?? 0);
    const displayOldPrice = saleIsActiveState && selectedVariant && selectedVariant.oldPrice > selectedVariant.price ? selectedVariant.oldPrice : null;
    const showFromPrice = !selectedVariant && product.variants.length > 1;
    const installmentPrice = typeof displayPrice === 'number' && displayPrice > 0 ? (displayPrice / 5).toFixed(2) : '--,--';

    // --- JSX Principal ---
    return (
        <div className={styles.pageWrapper}>
            <div className={`container ${styles.pageLayout}`}>
                {/* Coluna 1: Galeria */}
                <div className={styles.galleryColumn}>
                    <ProductGallery images={product.images || []} productName={product.nome || 'Produto'} />
                </div>

                {/* Coluna 2: Informações */}
                <div className={styles.infoColumn}>
                    <h1 className={styles.title}>{product.nome}</h1>
                    {saleIsActiveState && <span className={styles.saleTag}>PROMOÇÃO</span>}

                    {/* Preços */}
                    <div className={styles.priceSection}>
                        {displayOldPrice !== null && (<span className={styles.oldPrice}>{formatCurrency(displayOldPrice)}</span>)}
                        <span className={styles.price}>{formatCurrency(displayPrice)}</span>
                        <span className={styles.installments}>{showFromPrice ? 'A partir de ' : ''}ou 5x de R$ {installmentPrice} sem juros</span>
                    </div>

                    {/* Seleção de Cor */}
                    <div className={styles.selectorGroup}>
                        <label>Cor: <strong>{selectedColor || 'Selecione'}</strong></label>
                        <div className={styles.swatches}>
                            {availableColors.map(color => (<button key={color} className={`${styles.swatch} ${selectedColor === color ? styles.activeSwatch : ''}`} title={color} onClick={() => handleSelectColor(color)}>{color}</button>))}
                        </div>
                    </div>

                    {/* Seleção de Tamanho */}
                    <div className={styles.selectorGroup}>
                        <label>Tamanho:</label>
                        <div className={styles.sizeButtons}>
                            {availableSizes.length > 0 ? (
                                availableSizes.map(size => (<button key={size} className={`${styles.sizeBtn} ${selectedSize === size ? styles.activeSize : ''}`} onClick={() => handleSelectSize(size)} disabled={!selectedColor}>{size}</button>))
                            ) : (<span className={styles.noSizeText}>Selecione uma cor para ver os tamanhos.</span>)}
                        </div>
                        {selectionError && (<span className={styles.errorText}>{selectionError}</span>)}
                    </div>

                    {/* Botões de Ação */}
                    <div className={styles.actionButtons}>
                        <button onClick={handleAddToCart} className={styles.btnAddToCart} disabled={!selectedVariant || selectedVariant.stock <= 0}>
                            {selectedVariant && selectedVariant.stock <= 0 ? "Fora de Estoque" : "Adicionar ao Carrinho"}
                        </button>
                        <button className={styles.btnFavorite} aria-label="Adicionar aos favoritos"><FaHeart /></button>
                    </div>

                    {/* Calculadora de Frete */}
                    <div className={styles.shippingCalculator}>
                        <label htmlFor="cep"><FaShippingFast /> Calcular frete e prazo</label>
                        <div className={styles.shippingForm}>
                            <input id="cep" type="text" placeholder="Digite seu CEP" maxLength={9} value={cep} onChange={(e) => { const formattedCep = e.target.value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2'); setCep(formattedCep); setShippingError(null); setShippingInfo(null); }} />
                            <button onClick={handleCalculateShipping} disabled={shippingLoading}>
                                {shippingLoading ? <FaSpinner className={styles.spinner} /> : 'Calcular'}
                            </button>
                        </div>
                        {shippingError && <p className={styles.shippingError}>{shippingError}</p>}
                        {shippingInfo && (
                            <div className={styles.shippingResult}>
                                <p>Entrega para {shippingInfo.city}, {shippingInfo.state}:</p>
                                <p><strong>Valor: {formatCurrency(shippingInfo.cost)}</strong> (até {shippingInfo.days} dias úteis)</p>
                            </div>
                        )}
                    </div>
                </div> {/* Fim InfoColumn */}
            </div> {/* Fim PageLayout */}

            {/* Detalhes (Accordion) */}
            <div className={`${styles.detailsSection} container`}>
                <Accordion title="Descrição" startOpen={true}><p>{product.descricao || "Descrição não disponível."}</p></Accordion>
                <Accordion title="Detalhes"><p><strong>Categoria:</strong> {product.categoria || "N/A"}</p></Accordion>
            </div>

            {/* "Quem viu, viu também" */}
            <RelatedProducts category={product?.categoria} currentProductId={productId} />

            {/* Avaliações */}
            <ReviewsSection productId={productId} productName={product?.nome} />

            {/* Perguntas e Respostas */}
            <QnASection productId={productId} productName={product?.nome} />

        </div> // Fim pageWrapper
    );
};


// --- Componente Interno: RelatedProducts ---
const RelatedProducts = ({ category, currentProductId }) => {
    const [related, setRelated] = useState([]);
    const [loadingRelated, setLoadingRelated] = useState(true);

    const fetchRelated = useCallback(async () => {
        if (!category || !currentProductId) { setLoadingRelated(false); return; }
        setLoadingRelated(true);
        try {
            const q = query(
                collection(db, 'products'),
                where('categoria', '==', category),
                where('__name__', '!=', currentProductId),
                limit(10)
            );
            const querySnapshot = await getDocs(q);
            const relatedData = querySnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(p => p.variants && p.images); // Filtra válidos
            setRelated(relatedData);
        } catch (error) {
            console.error("Erro ao buscar relacionados:", error);
        } finally { setLoadingRelated(false); }
    }, [category, currentProductId]);

    useEffect(() => {
        fetchRelated();
    }, [fetchRelated]);

    if (loadingRelated || related.length === 0) {
        return null; // Não renderiza se vazio ou carregando
    }

    return (
        <section className={styles.relatedSection}>
            <div className="container">
                <h2 className={styles.relatedTitle}>Quem viu, viu também</h2>
            </div>
            <ProductCarousel products={related} />
        </section>
    );
};

// --- Componentes Internos com Lógica Básica: Avaliações e Perguntas ---
const ReviewsSection = ({ productId, productName }) => {
    const user = useAuthStore((state) => state.user);
    const [showForm, setShowForm] = useState(false);
    return (
        <section id="avaliacoes" className={`${styles.interactiveSection} container`}>
             <h2 className={styles.sectionTitle}>Avaliações sobre "{productName || 'este produto'}"</h2>
             <ReviewList productId={productId} /> 
             {user ? (
                <>
                    <button className={styles.askButton} onClick={() => setShowForm(!showForm)}>
                        {showForm ? "Fechar Avaliação" : "Deixar sua avaliação"}
                    </button>
                    {showForm && <ReviewForm productId={productId} />}
                </>
             ) : ( <p className={styles.loginPrompt}><Link to="/login">Faça login</Link> para deixar sua avaliação.</p> )}
        </section>
    );
};

const QnASection = ({ productId, productName }) => {
    const user = useAuthStore((state) => state.user);
    const [showForm, setShowForm] = useState(false);
    // Usa a constante do módulo
    const isAdmin = user?.email === ADMIN_EMAIL;
    return (
        <section className={`${styles.interactiveSection} container`}>
             <h2 className={styles.sectionTitle}>Perguntas e Respostas</h2>
             <QuestionList productId={productId} isAdmin={isAdmin} />
             {user ? (
                <>
                    <button className={styles.askButton} onClick={() => setShowForm(!showForm)}>
                        <FaEdit /> {showForm ? "Fechar Pergunta" : "Faça sua pergunta"}
                    </button>
                    {showForm && <QuestionForm productId={productId} />}
                </>
             ) : ( <p className={styles.loginPrompt}><Link to="/login">Faça login</Link> para fazer uma pergunta.</p> )}
        </section>
    );
};

export default ProductPage;