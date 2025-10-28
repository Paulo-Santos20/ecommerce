import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/ui/layout/Layout';
import Loading from '../components/ui/Loading/Loading';

// --- Code Splitting (Performance Total) ---
// As páginas só são carregadas quando o usuário acessa a rota.
const Home = lazy(() => import('../pages/Home/Home'));
const Shop = lazy(() => import('../pages/Shop/Shop'));
const ProductPage = lazy(() => import('../pages/ProductPage/ProductPage'));
const Cart = lazy(() => import('../pages/Cart/Cart'));
const Checkout = lazy(() => import('../pages/Checkout/Checkout'));
const LoginPage = lazy(() => import('../pages/Auth/LoginPage'));
const AdminProducts = lazy(() => import('../pages/Admin/AdminProducts'));

/**
 * Gerenciador central de rotas da aplicação.
 * Utiliza Suspense para mostrar um 'Loading' enquanto os
 * componentes lazy (páginas) são carregados.
 */
const AppRoutes = () => {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Rotas Públicas com Layout (Header/Footer) */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="loja" element={<Shop />} />
          <Route path="produto/:id" element={<ProductPage />} />
          <Route path="carrinho" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          
          {/* Rota de Admin (ainda não protegida) */}
          <Route path="admin" element={<AdminProducts />} />
        </Route>

        {/* Rotas sem o Layout (ex: Login, Cadastro) */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* TODO: Adicionar rota 404 */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;