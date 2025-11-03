import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { FaTachometerAlt, FaBox, FaTags, FaClipboardList, FaUsers, FaChartBar, FaCogs } from 'react-icons/fa';
import styles from './AdminLayout.module.css'; // Novo CSS
import { useAuthStore } from '../../../store/useAuthStore';

// Links da barra lateral
const adminLinks = [
  { name: 'Dashboard', path: '/admin', icon: <FaTachometerAlt /> },
  { name: 'Pedidos', path: 'pedidos', icon: <FaClipboardList /> },
  { name: 'Produtos', path: 'produtos', icon: <FaBox /> },
  { name: 'Categorias', path: 'categorias', icon: <FaTags /> },
  { name: 'Usuários', path: 'usuarios', icon: <FaUsers /> },
  { name: 'Relatórios', path: 'relatorios', icon: <FaChartBar /> },
  { name: 'Configurações', path: 'configuracoes', icon: <FaCogs /> },
];

/**
 * O Layout do Painel de Controle (CMS)
 * Contém a barra lateral de navegação e a área de conteúdo.
 */
const AdminLayout = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <div className={styles.adminLayout}>
      {/* Barra Lateral (Sidebar) */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h3>CMS Fina Estampa</h3>
          <p>Bem-vindo(a), {user?.displayName?.split(' ')[0]}!</p>
        </div>
        <nav className={styles.sidebarNav}>
          {adminLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              // 'end' é crucial para o link "Dashboard" não ficar ativo sempre
              end={link.path === '/admin'} 
              className={({ isActive }) => isActive ? styles.activeLink : ''}
            >
              {link.icon}
              <span>{link.name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Área de Conteúdo Principal */}
      <main className={styles.adminContent}>
        {/* As páginas (ex: AdminOrders) serão renderizadas aqui */}
        <Outlet /> 
      </main>
    </div>
  );
};

export default AdminLayout;