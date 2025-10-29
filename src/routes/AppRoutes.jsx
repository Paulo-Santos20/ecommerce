import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/layout/Layout'; // Importa o Layout com Header/Footer
import Loading from '../components/ui/Loading/Loading';

// --- Code Splitting ---
const Home = lazy(() => import('../pages/Home/Home'));
const Shop = lazy(() => import('../pages/Shop/Shop'));
const ProductPage = lazy(() => import('../pages/ProductPage/ProductPage'));
const Cart = lazy(() => import('../pages/Cart/Cart'));
const Checkout = lazy(() => import('../pages/Checkout/Checkout'));
const AdminProducts = lazy(() => import('../pages/Admin/AdminProducts'));
const LoginPage = lazy(() => import('../pages/Auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/Auth/RegisterPage'));
const MyOrders = lazy(() => import('../pages/MyOrders/MyOrders'));

const AppRoutes = () => {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* --- TODAS AS ROTAS COM LAYOUT FICAM AQUI DENTRO --- */}
        <Route path="/" element={<Layout />}>
          {/* Páginas Principais */}
          <Route index element={<Home />} />
          <Route path="loja" element={<Shop />} />
          <Route path="produto/:id" element={<ProductPage />} />
          <Route path="carrinho" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          
          {/* Páginas de Admin */}
          <Route path="admin" element={<AdminProducts />} />
          
          {/* --- ROTAS DE AUTENTICAÇÃO MOVIDAS PARA CÁ --- */}
          <Route path="login" element={<LoginPage />} />
          <Route path="cadastro" element={<RegisterPage />} />

          {/* TODO: Adicionar rota 404 aqui dentro também */}
          {/* <Route path="*" element={<NotFound />} /> */}

          <Route path="meus-pedidos" element={<MyOrders />} /> {/* 2. Adicionar a rota */}
        </Route>

        {/* Rotas SEM Layout (se houver alguma no futuro) iriam aqui fora */}
        
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;