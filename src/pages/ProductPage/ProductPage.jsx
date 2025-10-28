import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useCartStore } from '../../store/useCartStore';
import Loading from '../../components/ui/Loading/Loading';
import styles from './ProductPage.module.css';

// Helper de formatação de moeda
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const ProductPage = () => {
  const { id } = useParams(); // Pega o ID da URL
  const addItemToCart = useCartStore((state) => state.addItem);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setProduct({ id: docSnap.id, ...data });
          // Define a imagem principal (a primeira do array)
          if (data.imagens && data.imagens.length > 0) {
            setMainImage(data.imagens[0]);
          }
        } else {
          setError("Produto não encontrado.");
        }
      } catch (err) {
        console.error("Erro ao buscar produto:", err);
        setError("Não foi possível carregar o produto.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      addItemToCart(product, quantity);
      // TODO: Adicionar um feedback visual (ex: "Produto adicionado!")
      alert(`${quantity}x ${product.nome} adicionado(s) ao carrinho!`);
    }
  };

  const incrementQuantity = () => {
    setQuantity(prev => Math.min(prev + 1, product.estoque || 10));
  };
  const decrementQuantity = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  };

  if (loading) return <Loading />;
  if (error) return <p className="container">{error}</p>;
  if (!product) return null;

  return (
    <div className="container">
      <div className={styles.productGrid}>
        {/* Coluna de Imagens (Galeria/Carrossel) */}
        <div className={styles.imageColumn}>
          <div className={styles.mainImageWrapper}>
            <img 
              src={mainImage || 'https://via.placeholder.com/500'} 
              alt={product.nome} 
              className={styles.mainImage}
            />
          </div>
          {/* Miniaturas (Thumbnails) */}
          <div className={styles.thumbnailGrid}>
            {product.imagens?.map((imgUrl, index) => (
              <img
                key={index}
                src={imgUrl}
                alt={`${product.nome} - miniatura ${index + 1}`}
                className={`${styles.thumbnail} ${imgUrl === mainImage ? styles.activeThumbnail : ''}`}
                onClick={() => setMainImage(imgUrl)}
              />
            ))}
          </div>
        </div>

        {/* Coluna de Informações */}
        <div className={styles.infoColumn}>
          <h1 className={styles.title}>{product.nome}</h1>
          
          <div className={styles.priceContainer}>
            {product.precoAnterior && (
              <span className={styles.oldPrice}>
                {formatCurrency(product.precoAnterior)}
              </span>
            )}
            <span className={styles.price}>{formatCurrency(product.preco)}</span>
          </div>

          <p className={styles.description}>{product.descricao}</p>

          {/* Seletor de Quantidade */}
          <div className={styles.quantitySelector}>
            <button onClick={decrementQuantity} className={styles.quantityBtn}>-</button>
            <span className={styles.quantityDisplay}>{quantity}</span>
            <button onClick={incrementQuantity} className={styles.quantityBtn}>+</button>
          </div>
          
          <p className={styles.stock}>
            {product.estoque > 0 ? `${product.estoque} em estoque` : "Fora de estoque"}
          </p>

          {/* Botão de Adicionar ao Carrinho */}
          <button 
            onClick={handleAddToCart} 
            className={styles.addToCartButton}
            disabled={product.estoque === 0}
          >
            {product.estoque === 0 ? "Indisponível" : "Adicionar ao Carrinho"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;