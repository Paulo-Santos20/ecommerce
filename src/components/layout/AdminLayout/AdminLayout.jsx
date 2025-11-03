import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { 
    FaTachometerAlt, FaBox, FaTags, FaClipboardList, FaUsers, FaChartBar, FaCogs, 
    FaStore,
    FaTicketAlt, // Ícone de Cupom
    FaFileAlt // 1. Ícone de Páginas
} from 'react-icons/fa';
import styles from './AdminLayout.module.css';
import { useAuthStore } from '../../../store/useAuthStore'; // Verifique o caminho

// --- LISTA DE LINKS COMPLETA ---
const adminLinks = [
  { name: 'Dashboard', path: '/admin', icon: <FaTachometerAlt /> },
  { name: 'Pedidos', path: 'pedidos', icon: <FaClipboardList /> },
  { name: 'Produtos', path: 'produtos', icon: <FaBox /> },
  { name: 'Categorias', path: 'categorias', icon: <FaTags /> },
  { name: 'Cupons', path: 'cupons', icon: <FaTicketAlt /> }, 
  { name: 'Páginas', path: 'paginas', icon: <FaFileAlt /> }, // 2. Link de Páginas Adicionado
  { name: 'Usuários', path: 'usuarios', icon: <FaUsers /> },
  { name: 'Relatórios', path: 'relatorios', icon: <FaChartBar /> },
  { name: 'Configurações', path: 'configuracoes', icon: <FaCogs /> },
];
// ---------------------------------------------

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
        <div> {/* Wrapper para o header e a navegação */}
            <div className={styles.sidebarHeader}>
                <h3>CMS Fina Estampa</h3>
                <p>Bem-vindo(a), {user?.displayName?.split(' ')[0]}!</p>
            </div>
            <nav className={styles.sidebarNav}>
                {adminLinks.map((link) => (
                    <NavLink
                    key={link.path}
                    to={link.path}
                    // 'end' é crucial para o link "Dashboard" (/admin)
                    end={link.path === '/admin'} 
                    className={({ isActive }) => isActive ? styles.activeLink : ''}
                    >
                    {link.icon}
                    <span>{link.name}</span>
                    </NavLink>
                ))}
            </nav>
        </div>

        {/* Botão de Voltar ao Site */}
        <div className={styles.sidebarFooter}>
            <Link to="/" className={styles.backToSiteButton}>
                <FaStore />
                <span>Voltar ao Site</span>
            </Link>
        </div>
      </aside>

      {/* Área de Conteúdo Principal */}
      <main className={styles.adminContent}>
        <Outlet /> 
      </main>
    </div>
  );
};

export default AdminLayout;