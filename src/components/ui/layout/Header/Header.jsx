import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { 
  FaBars, 
  FaTimes, 
  FaShoppingCart, 
  FaUser, 
  FaSearch, 
  FaAngleLeft 
} from 'react-icons/fa';
import { useCartStore } from '../../../../store/useCartStore'; 
import styles from './Header.module.css';

/**
 * Header redesenhado com 3 camadas (Promo, Principal, Categorias).
 * - Inspirado em e-commerces de topo (ex: Marisa).
 * - Totalmente responsivo e Mobile-First.
 * - Gerencia estados para menu e pesquisa mobile (UI/UX).
 */
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Pega a contagem de itens do store (Zustand)
  const totalItems = useCartStore((state) => 
    state.items.reduce((acc, item) => acc + item.quantity, 0)
  );

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleSearch = () => setIsSearchOpen(!isSearchOpen);
  const closeAll = () => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
  };

  // Categorias (poderia vir do Firestore no futuro)
  const categories = [
    { name: 'Novidades', path: '/loja?categoria=novidades' },
    { name: 'Feminino', path: '/loja?categoria=feminino' },
    { name: 'Masculino', path: '/loja?categoria=masculino' },
    { name: 'Casa', path: '/loja?categoria=casa' },
    { name: 'Ofertas', path: '/loja?categoria=ofertas' },
  ];

  return (
    <>
      <header className={styles.header}>
        {/* === CAMADA 1: Banner de Promoção === */}
        <div className={styles.promoBar}>
          <div className="container">
            FRETE GRÁTIS em compras acima de R$199!
          </div>
        </div>

        {/* === CAMADA 2: Header Principal (Logo, Pesquisa, Conta, Carrinho) === */}
        <div className={styles.mainHeader}>
          <div className={`container ${styles.mainHeaderContent}`}>
            {/* Ícone do Menu Mobile (Esquerda) */}
            <button className={styles.mobileIcon} onClick={toggleMenu}>
              <FaBars />
            </button>

            {/* Logo (Centralizado no Mobile, Esquerda no Desktop) */}
            <Link to="/" className={styles.logo} onClick={closeAll}>
              Fina Estampa
            </Link>

            {/* Barra de Pesquisa (Desktop) */}
            <form className={styles.searchBarDesktop}>
              <input type="text" placeholder="O que você está procurando?" />
              <button type="submit"><FaSearch /></button>
            </form>

            {/* Ícones da Direita (Mobile e Desktop) */}
            <div className={styles.rightIcons}>
              {/* Ícone de Pesquisa (Mobile) */}
              <button className={`${styles.mobileIcon} ${styles.mobileSearchIcon}`} onClick={toggleSearch}>
                <FaSearch />
              </button>
              
              {/* Conta (Desktop) */}
              <Link to="/login" className={styles.desktopUserLink}>
                <FaUser />
                <span>Minha Conta</span>
              </Link>
              
              {/* Carrinho (Mobile e Desktop) */}
              <Link to="/carrinho" className={styles.cartIcon} onClick={closeAll}>
                <FaShoppingCart />
                {totalItems > 0 && (
                  <span className={styles.cartCount}>{totalItems}</span>
                )}
                <span className={styles.desktopCartText}>Carrinho</span>
              </Link>
            </div>
          </div>
        </div>

        {/* === CAMADA 3: Navegação de Categorias (Desktop) === */}
        <nav className={styles.categoryNav}>
          <div className={`container ${styles.categoryNavContent}`}>
            {categories.map((cat) => (
              <NavLink 
                key={cat.name} 
                to={cat.path} 
                className={({isActive}) => `${styles.categoryLink} ${isActive ? styles.activeCategory : ''}`}
              >
                {cat.name}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      {/* === OVERLAYS MOBILE === */}

      {/* Overlay do Menu Mobile */}
      {isMenuOpen && (
        <div className={styles.mobileBackdrop} onClick={closeAll}></div>
      )}
      <div className={`${styles.navMobile} ${isMenuOpen ? styles.isOpen : ''}`}>
        <div className={styles.navMobileHeader}>
          <strong>Menu</strong>
          <button onClick={toggleMenu}><FaTimes /></button>
        </div>
        <div className={styles.navMobileContent}>
          {/* Links de Categoria no Mobile */}
          {categories.map((cat) => (
            <Link key={cat.name} to={cat.path} className={styles.navMobileLink} onClick={closeAll}>
              {cat.name}
            </Link>
          ))}
          <hr className={styles.navMobileDivider} />
          <Link to="/login" className={styles.navMobileLink} onClick={closeAll}>
            <FaUser /> Minha Conta
          </Link>
        </div>
      </div>

      {/* Overlay da Pesquisa Mobile */}
      <div className={`${styles.searchMobile} ${isSearchOpen ? styles.isOpen : ''}`}>
        <div className="container">
          <button onClick={toggleSearch} className={styles.searchMobileBack}>
            <FaAngleLeft />
          </button>
          <input type="text" placeholder="Buscar..." autoFocus />
          <button type="submit" className={styles.searchMobileSubmit}>
            <FaSearch />
          </button>
        </div>
      </div>
    </>
  );
};

export default Header;