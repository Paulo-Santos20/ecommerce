import React from 'react';
import HeroCarousel from '../../components/ui/HeroCarousel/HeroCarousel';
import CategoryBubbles from '../../components/ui/CategoryBubbles/CategoryBubbles';
import PromoBanners from '../../components/ui/PromoBanners/PromoBanners';
import ProductCarousel from '../../components/ui/ProductCarousel/ProductCarousel';
import FeaturedProductGrid from '../../components/ui/FeaturedProductGrid/FeaturedProductGrid'; // Novo
import styles from './Home.module.css';

// --- DADOS MOCK (responsabilidade da Página) ---
// (Os arrays bestSellersProducts e saleProducts permanecem os mesmos)

const bestSellersProducts = [
  { id: 'p1', nome: 'Camiseta Básica Vinho', preco: 79.90, precoAnterior: 99.90, imagens: ['https://source.unsplash.com/400x400/?tshirt,wine&sig=1'] },
  { id: 'p2', nome: 'Calça Jeans Skinny', preco: 189.90, imagens: ['https://source.unsplash.com/400x400/?jeans,skinny&sig=2'] },
  { id: 'p3', nome: 'Vestido Floral Verão', preco: 229.90, imagens: ['https://source.unsplash.com/400x400/?dress,floral&sig=3'] },
  { id: 'p4', nome: 'Tênis Branco Casual', preco: 199.90, imagens: ['https://source.unsplash.com/400x400/?white,sneakers&sig=4'] },
  { id: 'p5', nome: 'Bolsa de Couro Caramelo', preco: 349.90, precoAnterior: 400.00, imagens: ['https://source.unsplash.com/400x400/?leather,bag&sig=5'] },
  { id: 'p6', nome: 'Jaqueta Bomber Preta', preco: 299.90, imagens: ['https://source.unsplash.com/400x400/?bomber,jacket&sig=6'] },
];

const saleProducts = [
  { id: 's1', nome: 'Jaqueta de Couro', preco: 499.90, precoAnterior: 699.90, imagens: ['https://source.unsplash.com/400x400/?leather,jacket&sig=10'] },
  { id: 's2', nome: 'Bota Coturno', preco: 279.90, precoAnterior: 350.00, imagens: ['https://source.unsplash.com/400x400/?combat,boot&sig=11'] },
  { id: 's3', nome: 'Camisa Social Linho', preco: 129.90, precoAnterior: 180.00, imagens: ['https://source.unsplash.com/400x400/?linen,shirt&sig=12'] },
  { id: 's4', nome: 'Mochila Executiva', preco: 199.90, precoAnterior: 250.00, imagens: ['https://source.unsplash.com/400x400/?backpack,laptop&sig=13'] },
  { id: 's5', nome: 'Saia Midi Plissada', preco: 139.90, precoAnterior: 199.90, imagens: ['https://source.unsplash.com/400x400/?pleated,skirt&sig=14'] },
];

// NOVO: Mock para "Produtos para Você" (20 produtos = 4 linhas * 5 colunas)
const recommendedProducts = [
  // Linha 1
  { id: 'r1', nome: 'Relógio Smartwatch', preco: 799.90, imagens: ['https://source.unsplash.com/400x400/?smartwatch&sig=20'] },
  { id: 'r2', nome: 'Fone Bluetooth', preco: 299.90, imagens: ['https://source.unsplash.com/400x400/?earbuds&sig=21'] },
  { id: 'r3', nome: 'Camisa Polo Azul', preco: 119.90, imagens: ['https://source.unsplash.com/400x400/?polo,shirt,blue&sig=22'] },
  { id: 'r4', nome: 'Sapato Social Couro', preco: 399.90, imagens: ['https://source.unsplash.com/400x400/?dress,shoes&sig=23'] },
  { id: 'r5', nome: 'Perfume Importado', preco: 599.90, precoAnterior: 700.00, imagens: ['https://source.unsplash.com/400x400/?perfume,bottle&sig=24'] },
  // Linha 2
  { id: 'r6', nome: 'Vestido de Festa', preco: 699.90, imagens: ['https://source.unsplash.com/400x400/?party,dress&sig=25'] },
  { id: 'r7', nome: 'Óculos de Sol Redondo', preco: 179.90, imagens: ['https://source.unsplash.com/400x400/?sunglasses,round&sig=26'] },
  { id: 'r8', nome: 'Mala de Viagem', preco: 450.00, imagens: ['https://source.unsplash.com/400x400/?suitcase,travel&sig=27'] },
  { id: 'r9', nome: 'Shorts de Corrida', preco: 89.90, imagens: ['https://source.unsplash.com/400x400/?running,shorts&sig=28'] },
  { id: 'r10', nome: 'Blusa de Tricô', preco: 159.90, imagens: ['https://source.unsplash.com/400x400/?knit,sweater&sig=29'] },
  // Linha 3
  { id: 'r11', nome: 'Jaqueta Jeans', preco: 239.90, imagens: ['https://source.unsplash.com/400x400/?denim,jacket&sig=30'] },
  { id: 'r12', nome: 'Calça de Moletom', preco: 129.90, imagens: ['https://source.unsplash.com/400x400/?sweatpants&sig=31'] },
  { id: 'r13', nome: 'Tênis de Corrida', preco: 349.90, imagens: ['https://source.unsplash.com/400x400/?running,shoe&sig=32'] },
  { id: 'r14', nome: 'Boné Básico', preco: 59.90, imagens: ['https://source.unsplash.com/400x400/?baseball,cap&sig=33'] },
  { id: 'r15', nome: 'Cinto de Couro', preco: 99.90, imagens: ['https://source.unsplash.com/400x400/?leather,belt&sig=34'] },
  // Linha 4
  { id: 'r16', nome: 'Pijama Confort', preco: 149.90, imagens: ['https://source.unsplash.com/400x400/?pajamas&sig=35'] },
  { id: 'r17', nome: 'Toalha de Banho', preco: 79.90, imagens: ['https://source.unsplash.com/400x400/?bath,towel&sig=36'] },
  { id: 'r18', nome: 'Luminária de Mesa', preco: 199.90, imagens: ['https://source.unsplash.com/400x400/?desk,lamp&sig=37'] },
  { id: 'r19', nome: 'Caneca de Cerâmica', preco: 49.90, imagens: ['https://source.unsplash.com/400x400/?ceramic,mug&sig=38'] },
  { id: 'r20', nome: 'Tapete Sala', preco: 299.90, imagens: ['https://source.unsplash.com/400x400/?living,room,rug&sig=39'] },
];


/**
 * Página Home. (Controladora de Layout)
 * ... (lista de seções)
 * 6. Grade de Produtos "Para Você" (FeaturedProductGrid)
 */
const Home = () => {
  return (
    <div className={styles.homePage}>
      
      <HeroCarousel />

      <section className={`${styles.homeSection} ${styles.categorySection} container`}>
        <h2 className={styles.sectionTitle}>Navegue por Categorias</h2>
        <CategoryBubbles />
      </section>

      <section className={`${styles.homeSection} ${styles.promoSection}`}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Conheça Nossas Ofertas</h2>
          <PromoBanners />
        </div>
      </section>

      <section className={`${styles.homeSection} ${styles.productSection}`}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Mais Vendidos</h2>
        </div>
        <ProductCarousel products={bestSellersProducts} />
      </section>

      <section className={`${styles.homeSection} ${styles.saleSection}`}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Produtos que Baixaram o Preço</h2>
        </div>
        <ProductCarousel products={saleProducts} />
      </section>

      {/* 6. Seção "Produtos para Você" (NOVO) */}
      <section className={`${styles.homeSection} ${styles.productSection}`}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Produtos para Você</h2>
        </div>
        <FeaturedProductGrid products={recommendedProducts} />
      </section>

    </div>
  );
};

export default Home;