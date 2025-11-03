import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaFacebookF, FaInstagram, FaTwitter, FaYoutube,
  FaCcVisa, FaCcMastercard, FaPaypal, FaBarcode 
} from 'react-icons/fa';
import { useSettings } from '../../../context/SettingsContext'; // 1. Importar
import styles from './Footer.module.css';

/**
 * Componente de Rodapé Completo.
 * ATUALIZADO: Agora busca os dados (CNPJ, Endereço, Redes Sociais) do SettingsContext.
 */
const Footer = () => {
  // 2. Puxa as configurações
  const { settings } = useSettings();
  const info = settings.footerInfo; // (ex: { cnpj, address, ... })
  const social = settings.socialMedia; // (ex: { instagram, facebook })

  return (
    <footer className={styles.footer}>
      {/* Camada 1: Newsletter */}
      <section className={styles.newsletter}>
        {/* ... (Formulário da Newsletter inalterado) ... */}
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
            <Link to="/politica-privacidade">Política de Privacidade</Link>
          </div>

          {/* Coluna 2: Ajuda */}
          <div className={styles.footerColumn}>
            <h4>Ajuda e Suporte</h4>
            <Link to="/faq">Perguntas Frequentes</Link>
            <Link to="/entrega">Como Acompanhar</Link>
            <Link to="/trocas">Trocas e Devoluções</Link>
            <Link to="/formas-de-pagamento">Formas de Pagamento</Link>
          </div>

          {/* Coluna 3: Minha Conta */}
          <div className={styles.footerColumn}>
            <h4>Minha Conta</h4>
            <Link to="/login">Fazer Login</Link>
            <Link to="/cadastro">Criar Conta</Link>
            <Link to="/meus-pedidos">Meus Pedidos</Link>
          </div>

          {/* Coluna 4: Social e Pagamento (Dinâmico) */}
          <div className={styles.footerColumn}>
            <h4>Siga-nos</h4>
            <div className={styles.socialIcons}>
              {social.facebook && <a href={social.facebook} target="_blank" rel="noopener noreferrer"><FaFacebookF /></a>}
              {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer"><FaInstagram /></a>}
              {/* Adicione outros se necessário (ex: Twitter, Youtube) */}
            </div>
            
            <h4 className={styles.paymentTitle}>Pagamento</h4>
            <div className={styles.paymentIcons}>
              <FaCcVisa />
              <FaCcMastercard />
              <FaPaypal />
              <FaBarcode />
            </div>
          </div>
        </div>
      </section>

      {/* Camada 4: Copyright (Dinâmico) */}
      <section className={styles.footerBottom}>
        <div className="container">
          <p>&copy; 2025 {settings.storeName}. Todos os direitos reservados.</p>
          {/* 3. Renderiza os dados do Footer */}
          {info.cnpj && info.address && (
            <p>{settings.storeName} S.A. | CNPJ: {info.cnpj} | {info.address}</p>
          )}
        </div>
      </section>
    </footer>
  );
};

export default Footer;