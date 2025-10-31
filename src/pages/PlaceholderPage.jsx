import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaWrench } from 'react-icons/fa';
import styles from './PlaceholderPage.module.css';

// Página genérica para seções em construção
const PlaceholderPage = () => {
    const location = useLocation();
    // Pega o nome da rota (ex: "/enderecos" -> "Enderecos")
    const pageName = location.pathname.replace('/', '').replace('-', ' ');

    return (
        <div className={`container ${styles.placeholderPage}`}>
            <FaWrench />
            <h1 className={styles.title}>{pageName}</h1>
            <p>Esta seção está em construção.</p>
            <Link to="/" className={styles.ctaButton}>Voltar para a Home</Link>
        </div>
    );
};
export default PlaceholderPage;