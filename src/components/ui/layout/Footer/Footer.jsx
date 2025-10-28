import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaFacebookF, 
  FaInstagram, 
  FaTwitter, 
  FaYoutube 
} from 'react-icons/fa';
import { 
  FaCcVisa, 
  FaCcMastercard, 
  FaPaypal, 
  FaBarcode 
} from 'react-icons/fa';
import styles from './Footer.module.css';

/**
 * Componente de Rodapé Completo.
 * - Inspirado em layouts de e-commerce (ex: Marisa).
 * - 4 Camadas: Newsletter, Links, Social/Pagamento, Copyright.
 * - Totalmente responsivo (Mobile-First).
 * (Princípios: UI/UX de Excelência, Design Responsivo)
 */
const Footer = () => {
  return (
    <footer className={styles.footer}>
      {/* Camada 1: Newsletter */}
      <section className={styles.newsletter}>
        <div className="container">
          <h3>Receba Nossas Novidades</h3>
          <p>Cadastre-se e ganhe 10% OFF na sua primeira compra!</p>
          <form className={styles.newsletterForm}>
            <input type="email" placeholder="Digite seu e-mail" />
            <button type="submit">Cadastrar</button>
          </form>
        </div>
      </section>

      {/* Camada 2: Links Principais */}
      <section className={styles.footerMain}>
        <div className={`container ${styles.footerGrid}`}>
          {/* Coluna 1: Institucional */}
          <div className={styles.footerColumn}>
            <h4>Fina Estampa</h4>
            <Link to="/sobre">Sobre Nós</Link>
            <Link to="/lojas">Nossas Lojas</Link>
            <Link to="/trabalhe-conosco">Trabalhe Conosco</Link>
          </div>

          {/* Coluna 2: Ajuda */}
          <div className={styles.footerColumn}>
            <h4>Ajuda e Suporte</h4>
            <Link to="/faq">Perguntas Frequentes</Link>
            <Link to="/entrega">Como Acompanhar</Link>
            <Link to="/trocas">Trocas e Devoluções</Link>
            <Link to="/pagamento">Formas de Pagamento</Link>
          </div>

          {/* Coluna 3: Minha Conta */}
          <div className={styles.footerColumn}>
            <h4>Minha Conta</h4>
            <Link to="/login">Fazer Login</Link>
            <Link to="/cadastro">Criar Conta</Link>
            <Link to="/meus-pedidos">Meus Pedidos</Link>
          </div>

          {/* Coluna 4: Social e Pagamento (Combinadas) */}
          <div className={styles.footerColumn}>
            <h4>Siga-nos</h4>
            <div className={styles.socialIcons}>
              <a href="#" target="_blank" rel="noopener noreferrer"><FaFacebookF /></a>
              <a href="#" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
              <a href="#" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
              <a href="#" target="_blank" rel="noopener noreferrer"><FaYoutube /></a>
            </div>
            
            <h4 className={styles.paymentTitle}>Pagamento</h4>
            <div className={styles.paymentIcons}>
              <FaCcVisa />
              <FaCcMastercard />
              <FaPaypal />
              <FaBarcode /> {/* (Simulando Boleto) */}
            </div>
          </div>
        </div>
      </section>

      {/* Camada 4: Copyright (Fine Print) */}
      <section className={styles.footerBottom}>
        <div className="container">
          <p>&copy; 2025 Fina Estampa E-commerce. Todos os direitos reservados.</p>
          <p>Fina Estampa S.A. | CNPJ: 00.000.000/0001-00 | Av. Exemplo, 1234, Recife-PE</p>
        </div>
      </section>
    </footer>
  );
};

export default Footer;