/**
 * ARQUIVO CENTRAL DE PERMISSÕES
 * Define a lista mestra de permissões e os modelos de perfil.
 * (Princípio: Arquitetura Escalável)
 */

// 1. A Lista Mestra de todas as permissões possíveis
export const MASTER_PERMISSIONS_LIST = [
  { id: 'can_view_dashboard', label: 'Ver Dashboard' },
  { id: 'can_manage_orders', label: 'Gerenciar Pedidos (Ver, Mudar Status)' },
  { id: 'can_manage_products', label: 'Gerenciar Produtos (Criar, Editar)' },
  { id: 'can_delete_products', label: 'DELETAR Produtos (Permissão Perigosa)' },
  { id: 'can_manage_categories', label: 'Gerenciar Categorias' },
  { id: 'can_manage_users', label: 'Gerenciar Usuários (Criar, Editar Permissões)' },
  { id: 'can_view_reports', label: 'Ver Relatórios' },
  { id: 'can_manage_settings', label: 'Gerenciar Configurações da Loja (Banners)' },
];

// 2. Os "Modelos" de permissão para cada Perfil (Role)
// Usamos um Objeto (mapa) para performance
export const ROLE_TEMPLATES = {
  user: {},
  vendedor: {
    'can_view_dashboard': true,
    'can_manage_orders': true,
    'can_manage_products': true,
    'can_manage_categories': true,
  },
  admin: MASTER_PERMISSIONS_LIST.reduce((acc, perm) => {
    acc[perm.id] = true; // Admin tem tudo
    return acc;
  }, {}),
};