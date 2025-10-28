import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header/Header';
import Footer from './Footer/Footer'; // Importa o novo Footer
import styles from './Layout.module.css';

/**
 * Layout principal atualizado.
 * Renderiza o Header, o Conteúdo (Outlet) e o novo Footer completo.
 */
const Layout = () => {
  return (
    <div className={styles.layoutWrapper}>
      {/* 1. Header (Componente atualizado) */}
      <Header />

      {/* 2. Conteúdo Principal (Páginas) */}
      <main className={styles.mainContent}>
        <Outlet />
      </main>

      {/* 3. Footer (Novo Componente) */}
      <Footer />
    </div>
  );
};

export default Layout;