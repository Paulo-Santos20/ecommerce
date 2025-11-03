import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Loading from '../components/ui/Loading/Loading';

// --- Importações de Rotas ---
import AdminRoute from './AdminRoute'; // O "Porteiro"
import AdminLayout from '../components/layout/AdminLayout/AdminLayout'; // O "Layout do CMS"

// Páginas Públicas (Main Site)
const Home = lazy(() => import('../pages/Home/Home'));
const Shop = lazy(() => import('../pages/Shop/Shop'));
const ProductPage = lazy(() => import('../pages/ProductPage/ProductPage'));
const Cart = lazy(() => import('../pages/Cart/Cart'));
const Checkout = lazy(() => import('../pages/Checkout/Checkout'));
const LoginPage = lazy(() => import('../pages/Auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/Auth/RegisterPage'));
const MyOrders = lazy(() => import('../pages/MyOrders/MyOrders'));
const RecentlyViewed = lazy(() => import('../pages/RecentlyViewed/RecentlyViewed'));
const NotificationsPage = lazy(() => import('../pages/Notifications/NotificationsPage'));
const ContactPage = lazy(() => import('../pages/Contact/ContactPage'));
const MyAccountPage = lazy(() => import('../pages/MyAccount/MyAccountPage'));
const ChangeContactPage = lazy(() => import('../pages/ChangeContact/ChangeContactPage'));
const AddressPage = lazy(() => import('../pages/Address/AddressPage'));
const PaymentMethodsPage = lazy(() => import('../pages/PaymentMethods/PaymentMethodsPage'));
const ChangePasswordPage = lazy(() => import('../pages/ChangePassword/ChangePasswordPage'));
const PlaceholderPage = lazy(() => import('../pages/PlaceholderPage')); 

// Páginas do Admin (CMS)
const AdminDashboard = lazy(() => import('../pages/Admin/AdminDashboard'));
const AdminProducts = lazy(() => import('../pages/Admin/AdminProducts'));
const AdminOrders = lazy(() => import('../pages/Admin/AdminOrders'));
const AdminCategories = lazy(() => import('../pages/Admin/AdminCategories'));
const AdminUsers = lazy(() => import('../pages/Admin/AdminUsers'));
const AdminSettings = lazy(() => import('../pages/Admin/AdminSettings'));
const AdminReports = lazy(() => import('../pages/Admin/AdminReports'));

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
          
          <Route path="meus-pedidos" element={<MyOrders />} />
          <Route path="ultimos-vistos" element={<RecentlyViewed />} />
          <Route path="notificacoes" element={<NotificationsPage />} />
          <Route path="fale-conosco" element={<ContactPage />} />
          <Route path="meus-dados" element={<MyAccountPage />} />
          <Route path="alterar-contato" element={<ChangeContactPage />} />
          <Route path="enderecos" element={<AddressPage />} />
          <Route path="formas-de-pagamento" element={<PaymentMethodsPage />} />
          <Route path="alterar-senha" element={<ChangePasswordPage />} />
          <Route path="politica-privacidade" element={<PlaceholderPage />} />
        </Route>

        {/* --- 2. ROTAS DO CMS (com Layout de Admin) --- */}
        {/* A Rota 'AdminRoute' protege todo o grupo */}
        <Route path="/admin" element={<AdminRoute allowRoles={['admin', 'vendedor']} />}>
          {/* O 'AdminLayout' adiciona a barra lateral */}
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="pedidos" element={<AdminOrders />} />
            <Route path="produtos" element={<AdminProducts />} />
            <Route path="categorias" element={<AdminCategories />} />
            <Route path="usuarios" element={<AdminUsers />} />
            <Route path="relatorios" element={<AdminReports />} />
            <Route path="configuracoes" element={<AdminSettings />} />
            {/* Adicione outras rotas do CMS aqui */}
          </Route>
        </Route>
        
        {/* TODO: Rota 404 */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;