import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom'; // 1. Adiciona Link
import { 
    FaTachometerAlt, FaBox, FaTags, FaClipboardList, FaUsers, FaChartBar, FaCogs, 
    FaStore // 2. Ícone para o botão de voltar
} from 'react-icons/fa';
import styles from './AdminLayout.module.css';
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
        <div> {/* Wrapper para o header e a navegação (para o sticky footer) */}
            <div className={styles.sidebarHeader}>
                <h3>CMS Fina Estampa</h3>
                <p>Bem-vindo(a), {user?.displayName?.split(' ')[0]}!</p>
            </div>
            <nav className={styles.sidebarNav}>
                {adminLinks.map((link) => (
                    <NavLink
                    key={link.path}
                    to={link.path}
                    end={link.path === '/admin'} 
                    className={({ isActive }) => isActive ? styles.activeLink : ''}
                    >
                    {link.icon}
                    <span>{link.name}</span>
                    </NavLink>
                ))}
            </nav>
        </div>

        {/* --- 3. REQUISITO: Botão de Voltar ao Site --- */}
        <div className={styles.sidebarFooter}>
            <Link to="/" className={styles.backToSiteButton}>
                <FaStore />
                <span>Voltar ao Site</span>
            </Link>
        </div>
        {/* ------------------------------------------ */}

      </aside>

      {/* Área de Conteúdo Principal */}
      <main className={styles.adminContent}>
        <Outlet /> 
      </main>
    </div>
  );
};

export default AdminLayout;