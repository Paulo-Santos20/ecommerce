import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { 
  FaBars, FaTimes, FaShoppingCart, FaUser, FaSearch, FaAngleLeft, FaTrash, 
  FaBoxOpen, FaEye, FaBell, FaCommentDots, FaIdCard, FaMobileAlt, FaMapMarkedAlt, 
  FaCreditCard, FaLock, FaShieldAlt, FaSignOutAlt 
} from 'react-icons/fa'; // FaStore e FaTshirt removidos
import { useCartStore } from '../../../store/useCartStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { auth } from '../../../firebase/config';
import { signOut } from 'firebase/auth';
import { useSearch } from '../../../context/SearchContext'; 
import useDebounce from '../../../hooks/useDebounce'; 
import styles from './Header.module.css';

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const Header = () => {
  // ... (Estados, Refs, Stores inalterados) ...
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false); 
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false); 
  const cartRef = useRef(null);
  const userMenuRef = useRef(null);
  const searchRef = useRef(null); 
  const navigate = useNavigate();
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const user = useAuthStore((state) => state.user);

  // --- Lógica de Busca (inalterada) ---
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileSearchTerm, setMobileSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearchActive, setIsSearchActive] = useState(false); 
  const { getSuggestions } = useSearch(); 
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const debouncedMobileSearchTerm = useDebounce(mobileSearchTerm, 300);

  useEffect(() => {
    const term = isSearchOpen ? debouncedMobileSearchTerm : debouncedSearchTerm;
    if (term.length > 1 && (isSearchActive || isSearchOpen)) {
      const newSuggestions = getSuggestions(term);
      setSuggestions(newSuggestions);
    } else {
      setSuggestions([]); 
    }
  }, [debouncedSearchTerm, debouncedMobileSearchTerm, getSuggestions, isSearchActive, isSearchOpen]);
  
  // ... (Cálculo de totais e Toggles inalterados) ...
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleSearch = () => { setIsSearchOpen(!isSearchOpen); setMobileSearchTerm(''); setSuggestions([]); };
  const toggleCart = (e) => { e.preventDefault(); setIsCartOpen(!isCartOpen); setIsMenuOpen(false); setIsSearchOpen(false); setIsUserMenuOpen(false); };
  const toggleUserMenu = (e) => { e.preventDefault(); setIsUserMenuOpen(!isUserMenuOpen); setIsMenuOpen(false); setIsSearchOpen(false); setIsCartOpen(false); };
  const closeAll = () => {
    setIsMenuOpen(false); setIsSearchOpen(false); setIsCartOpen(false); 
    setIsUserMenuOpen(false); setSuggestions([]); setIsSearchActive(false);
    setSearchTerm(''); setMobileSearchTerm('');
  };
  
  // ... (Efeitos de Clique Fora inalterados) ...
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cartRef.current && !cartRef.current.contains(event.target)) {
         const cartIcon = cartRef.current.querySelector(`.${styles.cartIcon}`);
         if (!cartIcon || !cartIcon.contains(event.target)) { setIsCartOpen(false); }
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
         const userButton = userMenuRef.current.querySelector(`.${styles.desktopUserButton}`);
         if (!userButton || !userButton.contains(event.target)) { setIsUserMenuOpen(false); }
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchActive(false); setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, [cartRef, userMenuRef, searchRef]);

  // ... (Logout e Handlers de Busca inalterados) ...
  const handleLogout = (e) => { e.preventDefault(); closeAll(); signOut(auth).then(() => navigate('/')); };
  const handleSearchSubmit = (e) => { e.preventDefault(); if (searchTerm.trim() === '') return; navigate(`/loja?q=${encodeURIComponent(searchTerm)}`); closeAll(); };
  const handleMobileSearchSubmit = (e) => { e.preventDefault(); if (mobileSearchTerm.trim() === '') return; navigate(`/loja?q=${encodeURIComponent(mobileSearchTerm)}`); closeAll(); };
  const handleSuggestionClick = (item) => {
    const url = item.type === 'produto' ? `/produto/${item.id}` : `/loja?categoria=${item.name}`;
    navigate(url);
    closeAll();
  };

  // Categorias (inalterado)
  const categories = [
    { name: 'Novidades', path: '/loja?categoria=Novidades' },
    { name: 'Feminino', path: '/loja?categoria=Feminino' },
    { name: 'Masculino', path: '/loja?categoria=Masculino' },
    { name: 'Casa', path: '/loja?categoria=Casa' },
    { name: 'Ofertas', path: '/loja?categoria=Ofertas' },
  ];

  return (
    <>
      <header className={styles.header}>
        {/* === CAMADA 1: Promo Bar === */}
        <div className={styles.promoBar}>
          <div className="container">FRETE GRÁTIS em compras acima de R$199!</div>
        </div>

        {/* === CAMADA 2: Header Principal === */}
        <div className={styles.mainHeader}>
          <div className={`container ${styles.mainHeaderContent}`}>
            <button className={styles.mobileIcon} onClick={toggleMenu}><FaBars /></button>
            <Link to="/" className={styles.logo} onClick={closeAll}>Fina Estampa</Link>
            
            {/* --- Formulário de Busca Desktop (com Wrapper) --- */}
            <div className={styles.searchWrapper} ref={searchRef}>
              <form className={styles.searchBarDesktop} onSubmit={handleSearchSubmit}>
                <input type="text" placeholder="O que você está procurando?" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onFocus={() => setIsSearchActive(true)} />
                <button type="submit"><FaSearch /></button>
              </form>

              {/* --- Dropdown de Sugestões (Desktop) ATUALIZADO --- */}
              {isSearchActive && !isSearchOpen && suggestions.length > 0 && (
                <div className={styles.searchResultsDropdown}>
                  <ul>
                    {suggestions.map(item => (
                      <li key={`${item.type}-${item.id}`} onMouseDown={() => handleSuggestionClick(item)}>
                        {/* --- CORREÇÃO: Renderiza <img> em vez de ícone --- */}
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className={styles.suggestionImage} 
                        />
                        <span>{item.name}</span>
                        <small>{item.type}</small>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* --- Ícones da Direita (Usuário e Carrinho) --- */}
            <div className={styles.rightIcons}>
              <button className={`${styles.mobileIcon} ${styles.mobileSearchIcon}`} onClick={toggleSearch}><FaSearch /></button>
              
              <div ref={userMenuRef} className={styles.userMenuWrapper}>
                {user ? (
                  <button className={styles.desktopUserButton} onClick={toggleUserMenu}>
                    <FaUser />
                    <span>Olá, {user.displayName?.split(' ')[0] || user.email}</span>
                  </button>
                ) : (
                  <Link to="/login" className={styles.desktopUserButton} onClick={closeAll}>
                    <FaUser />
                    <span>Minha Conta</span>
                  </Link>
                )}
                {isUserMenuOpen && user && (
                  <div className={styles.userDropdown}>
                    <div className={styles.userDropdownHeader}><strong>{user.displayName}</strong><small>{user.email}</small></div>
                    <nav className={styles.userDropdownNav}>
                      <Link to="/meus-pedidos" onClick={closeAll}><FaBoxOpen /> Meus pedidos</Link>
                      <Link to="/ultimos-vistos" onClick={closeAll}><FaEye /> Ultimos produtos vistos</Link>
                      <Link to="/notificacoes" onClick={closeAll}><FaBell /> Notificações</Link>
                      <Link to="/fale-conosco" onClick={closeAll}><FaCommentDots /> Fale com a loja</Link>
                      <hr />
                      <Link to="/meus-dados" onClick={closeAll}><FaIdCard /> Dados pessoais</Link>
                      <Link to="/alterar-contato" onClick={closeAll}><FaMobileAlt /> Alterar email ou telefone</Link>
                      <Link to="/enderecos" onClick={closeAll}><FaMapMarkedAlt /> Endereços de entrega</Link>
                      <Link to="/formas-de-pagamento" onClick={closeAll}><FaCreditCard /> Formas de pagamento</Link>
                      <Link to="/alterar-senha" onClick={closeAll}><FaLock /> Senha de acesso</Link>
                      <Link to="/politica-privacidade" onClick={closeAll}><FaShieldAlt /> Politica de privacidade</Link>
                    </nav>
                    <div className={styles.userDropdownFooter}><button onClick={handleLogout} className={styles.logoutButton}><FaSignOutAlt /> Sair</button></div>
                  </div>
                )}
              </div>
              
              <div ref={cartRef} className={styles.cartIconWrapper}> 
                <button className={styles.cartIcon} onClick={toggleCart}>
                  <FaShoppingCart />
                  {totalItems > 0 && (<span className={styles.cartCount}>{totalItems}</span>)}
                  <span className={styles.desktopCartText}>Carrinho</span>
                </button>
                {isCartOpen && (
                  <div className={styles.miniCartDropdown}>
                    {items.length === 0 ? (
                      <p className={styles.emptyCartMsg}>Seu carrinho está vazio.</p>
                    ) : (
                      <>
                        <div className={styles.miniCartItems}>
                          {items.map(item => (
                            <div key={item.id} className={styles.miniCartItem}>
                              <img src={item.imagem} alt={item.nome} />
                              <div className={styles.miniCartItemInfo}>
                                <p>{item.nome}</p>
                                {(item.color || item.size) && (<small>{item.color} / {item.size}</small>)}
                                <div className={styles.miniCartQuantity}>
                                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                                  <span>{item.quantity}</span>
                                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                                </div>
                              </div>
                              <div className={styles.miniCartPrice}>
                                <span>{formatCurrency(item.price * item.quantity)}</span>
                                <button onClick={() => removeItem(item.id)} className={styles.miniCartRemoveBtn} aria-label={`Remover ${item.nome} do carrinho`}><FaTrash /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className={styles.miniCartFooter}>
                          <p>Subtotal: <strong>{formatCurrency(subtotal)}</strong></p>
                          <Link to="/carrinho" className={styles.goToCartBtn} onClick={closeAll}>Ver Carrinho Completo</Link>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* === CAMADA 3: Navegação de Categorias === */}
        <nav className={styles.categoryNav}>
          <div className={`container ${styles.categoryNavContent}`}>
            {categories.map((cat) => (
              <NavLink key={cat.name} to={cat.path} className={({isActive}) => `${styles.categoryLink} ${isActive ? styles.activeCategory : ''}`} onClick={closeAll}>
                {cat.name}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      {/* === OVERLAYS MOBILE === */}
      {isMenuOpen && (<div className={styles.mobileBackdrop} onClick={closeAll}></div>)}
      <div className={`${styles.navMobile} ${isMenuOpen ? styles.isOpen : ''}`}>
        <div className={styles.navMobileHeader}><strong>Menu</strong><button onClick={toggleMenu}><FaTimes /></button></div>
        <div className={styles.navMobileContent}>
          {categories.map((cat) => (
            <Link key={cat.name} to={cat.path} className={styles.navMobileLink} onClick={closeAll}>{cat.name}</Link>
          ))}
          <hr className={styles.navMobileDivider} />
          {user ? (
            <>
              <Link to="/meus-pedidos" className={styles.navMobileLink} onClick={closeAll}><FaUser /> Olá, {user.displayName?.split(' ')[0]}</Link>
              <a href="#" onClick={handleLogout} className={styles.navMobileLink}><FaSignOutAlt /> Sair</a>
            </>
          ) : (
            <Link to="/login" className={styles.navMobileLink} onClick={closeAll}><FaUser /> Minha Conta</Link>
          )}
        </div>
      </div>
      
      <div className={`${styles.searchMobile} ${isSearchOpen ? styles.isOpen : ''}`}>
        <form className="container" onSubmit={handleMobileSearchSubmit} ref={searchRef}>
          <button type="button" onClick={toggleSearch} className={styles.searchMobileBack}><FaAngleLeft /></button>
          <input type="text" placeholder="Buscar por produto ou categoria..." autoFocus value={mobileSearchTerm} onChange={(e) => setMobileSearchTerm(e.target.value)} onFocus={() => setIsSearchActive(true)} />
          <button type="submit" className={styles.searchMobileSubmit}><FaSearch /></button>
          
          {/* --- Dropdown de Sugestões (Mobile) ATUALIZADO --- */}
          {isSearchActive && isSearchOpen && suggestions.length > 0 && (
            <div className={styles.searchResultsDropdown}>
              <ul>
                {suggestions.map(item => (
                  <li key={`${item.type}-${item.id}`} onMouseDown={() => handleSuggestionClick(item)}>
                    {/* --- CORREÇÃO: Renderiza <img> em vez de ícone --- */}
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className={styles.suggestionImage} 
                    />
                    <span>{item.name}</span>
                    <small>{item.type}</small>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>
      </div>
    </>
  );
};

export default Header;