import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Loading from '../components/ui/Loading/Loading';

// --- Importações de Rotas ---
import AdminRoute from './AdminRoute'; // O "Porteiro"
import AdminLayout from '../components/layout/AdminLayout/AdminLayout';

// --- Páginas Públicas (Main Site) ---
const Home = lazy(() => import('../pages/Home/Home'));
const Shop = lazy(() => import('../pages/Shop/Shop'));
const ProductPage = lazy(() => import('../pages/ProductPage/ProductPage'));
const Cart = lazy(() => import('../pages/Cart/Cart'));
const Checkout = lazy(() => import('../pages/Checkout/Checkout'));
const LoginPage = lazy(() => import('../pages/Auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/Auth/RegisterPage'));
// Páginas da Conta
const MyOrders = lazy(() => import('../pages/MyOrders/MyOrders'));
const RecentlyViewed = lazy(() => import('../pages/RecentlyViewed/RecentlyViewed'));
const NotificationsPage = lazy(() => import('../pages/Notifications/NotificationsPage'));
const ContactPage = lazy(() => import('../pages/Contact/ContactPage'));
const MyAccountPage = lazy(() => import('../pages/MyAccount/MyAccountPage'));
const ChangeContactPage = lazy(() => import('../pages/ChangeContact/ChangeContactPage'));
const AddressPage = lazy(() => import('../pages/Address/AddressPage'));
const PaymentMethodsPage = lazy(() => import('../pages/PaymentMethods/PaymentMethodsPage'));
const ChangePasswordPage = lazy(() => import('../pages/ChangePassword/ChangePasswordPage'));
// O Renderizador de Páginas Dinâmicas (Substitui o Placeholder)
const DynamicPageRenderer = lazy(() => import('../pages/DynamicPageRenderer/DynamicPageRenderer'));

// --- Páginas do Admin (CMS) ---
const AdminDashboard = lazy(() => import('../pages/Admin/AdminDashboard'));
const AdminProducts = lazy(() => import('../pages/Admin/AdminProducts'));
const AdminOrders = lazy(() => import('../pages/Admin/AdminOrders'));
const AdminOrderDetails = lazy(() => import('../pages/Admin/AdminOrderDetails'));
const AdminCategories = lazy(() => import('../pages/Admin/AdminCategories'));
const AdminCoupons = lazy(() => import('../pages/Admin/AdminCoupons'));
const AdminUsers = lazy(() => import('../pages/Admin/AdminUsers'));
const AdminAuditLog = lazy(() => import('../pages/Admin/AdminAuditLog'));
const AdminReports = lazy(() => import('../pages/Admin/AdminReports'));
const AdminSettings = lazy(() => import('../pages/Admin/AdminSettings'));
// Novas Páginas de Conteúdo
const AdminPages = lazy(() => import('../pages/Admin/AdminPages'));
const AdminPageEditor = lazy(() => import('../pages/Admin/AdminPageEditor'));

const AppRoutes = () => {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* --- 1. ROTAS PÚBLICAS (com Header/Footer) --- */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="loja" element={<Shop />} />
          <Route path="produto/:id" element={<ProductPage />} />
          <Route path="carrinho" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />

          <Route path="login" element={<LoginPage />} />
          <Route path="cadastro" element={<RegisterPage />} />

          {/* Rotas da Conta do Usuário */}
          <Route path="meus-pedidos" element={<MyOrders />} />
          <Route path="ultimos-vistos" element={<RecentlyViewed />} />
          <Route path="notificacoes" element={<NotificationsPage />} />
          <Route path="fale-conosco" element={<ContactPage />} />
          <Route path="meus-dados" element={<MyAccountPage />} />
          <Route path="alterar-contato" element={<ChangeContactPage />} />
          <Route path="enderecos" element={<AddressPage />} />
          <Route path="formas-de-pagamento" element={<PaymentMethodsPage />} />
          <Route path="alterar-senha" element={<ChangePasswordPage />} />

          {/* Rotas de Conteúdo Estático (agora dinâmicas) */}
          <Route path="p/:slug" element={<DynamicPageRenderer />} />
          <Route path="sobre-nos" element={<DynamicPageRenderer slug="sobre-nos" />} />
          <Route path="faq" element={<DynamicPageRenderer slug="faq" />} />
        </Route>

        {/* --- 2. ROTAS DO CMS (com Layout de Admin) --- */}
        <Route path="/admin" element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="pedidos" element={<AdminOrders />} />
            <Route path="pedidos/:id" element={<AdminOrderDetails />} />
            <Route path="produtos" element={<AdminProducts />} />
            <Route path="categorias" element={<AdminCategories />} />
            <Route path="cupons" element={<AdminCoupons />} />

            <Route path="paginas" element={<AdminPages />} />
            <Route path="paginas/nova" element={<AdminPageEditor />} />
            <Route path="paginas/editar/:slug" element={<AdminPageEditor />} />

            <Route path="usuarios" element={<AdminUsers />} />
            <Route path="usuarios/:userId/auditoria" element={<AdminAuditLog />} />
            <Route path="relatorios" element={<AdminReports />} />
            <Route path="configuracoes" element={<AdminSettings />} />
          </Route>
        </Route>

        {/* Rota 404 (Renderiza a página 404 do CMS) */}
        <Route path="*" element={<Layout><DynamicPageRenderer slug="404" /></Layout>} />      </Routes>
    </Suspense>
  );
};

export default AppRoutes;