import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header/Header';
import Footer from './Footer/Footer';
import { ToastContainer } from 'react-toastify'; // 1. Importar
import 'react-toastify/dist/ReactToastify.css'; // 2. Importar o CSS
import styles from './Layout.module.css';

const Layout = () => {
  return (
    <div className={styles.layoutWrapper}>
      {/* 3. Adicionar o Container do Toast */}
      {/* Ele ficará "flutuando" na página */}
      <ToastContainer
        position="bottom-right"
        autoClose={3000} // Fecha após 3 segundos
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
      <Header />
      <main className={styles.mainContent}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;