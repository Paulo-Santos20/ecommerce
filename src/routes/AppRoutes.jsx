import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Loading from '../components/ui/Loading/Loading';

// --- Imports ---
const Home = lazy(() => import('../pages/Home/Home'));
const Shop = lazy(() => import('../pages/Shop/Shop'));
const ProductPage = lazy(() => import('../pages/ProductPage/ProductPage'));
const Cart = lazy(() => import('../pages/Cart/Cart'));
const Checkout = lazy(() => import('../pages/Checkout/Checkout'));
const AdminProducts = lazy(() => import('../pages/Admin/AdminProducts'));
const LoginPage = lazy(() => import('../pages/Auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/Auth/RegisterPage'));
const MyOrders = lazy(() => import('../pages/MyOrders/MyOrders'));
const RecentlyViewed = lazy(() => import('../pages/RecentlyViewed/RecentlyViewed'));
const NotificationsPage = lazy(() => import('../pages/Notifications/NotificationsPage'));
const ContactPage = lazy(() => import('../pages/Contact/ContactPage'));
const ChangeContactPage = lazy(() => import('../pages/ChangeContact/ChangeContactPage'));
const MyAccountPage = lazy(() => import('../pages/MyAccount/MyAccountPage'));
const AddressPage = lazy(() => import('../pages/Address/AddressPage'));
const PaymentMethodsPage = lazy(() => import('../pages/PaymentMethods/PaymentMethodsPage')); 
const ChangePasswordPage = lazy(() => import('../pages/ChangePassword/ChangePasswordPage'));

const PlaceholderPage = lazy(() => import('../pages/PlaceholderPage')); 

const AppRoutes = () => {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Páginas Principais */}
          <Route index element={<Home />} />
          <Route path="loja" element={<Shop />} />
          <Route path="produto/:id" element={<ProductPage />} />
          <Route path="carrinho" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="admin" element={<AdminProducts />} />

          {/* Páginas de Autenticação */}
          <Route path="login" element={<LoginPage />} />
          <Route path="cadastro" element={<RegisterPage />} />
          
          {/* Páginas da Conta do Usuário (do Dropdown) */}
          <Route path="meus-pedidos" element={<MyOrders />} />
          <Route path="ultimos-vistos" element={<RecentlyViewed />} />
          <Route path="notificacoes" element={<NotificationsPage />} />
          <Route path="fale-conosco" element={<ContactPage />} />
          
          {/* --- NOVAS ROTAS ADICIONADAS --- */}
          <Route path="meus-dados" element={<MyAccountPage />} />
          <Route path="alterar-contato" element={<ChangeContactPage />} />          
          <Route path="enderecos" element={<AddressPage />} />
          <Route path="formas-de-pagamento" element={<PaymentMethodsPage />} />
          <Route path="alterar-senha" element={<ChangePasswordPage />} />
          <Route path="politica-privacidade" element={<PlaceholderPage />} />
          
          {/* TODO: Rota 404 */}
          {/* <Route path="*" element={<NotFound />} /> */}
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;