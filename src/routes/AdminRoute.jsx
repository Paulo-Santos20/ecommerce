import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import Loading from '../components/ui/Loading/Loading';
import { toast } from 'react-toastify';

/**
 * Rota Protegida (Guarda de Rota) para o CMS.
 * Verifica se o usuário está logado e se tem o 'role' (papel)
 * de 'admin' ou 'vendedor'.
 */
const AdminRoute = ({ allowRoles = ['admin'] }) => {
    
    // --- CORREÇÃO APLICADA AQUI ---
    // Selecionamos cada "fatia" do estado individualmente
    // para evitar o loop infinito de renderização.
    const user = useAuthStore((state) => state.user);
    const isAuthReady = useAuthStore((state) => state.isAuthReady);
    // --- FIM DA CORREÇÃO ---

    // 1. Espera o Firebase Auth estar pronto
    if (!isAuthReady) {
        return <Loading />;
    }

    // 2. Se estiver pronto, mas não logado, redireciona para Login
    if (!user) {
        toast.warn("Você precisa estar logado para acessar esta página.");
        return <Navigate to="/login" replace state={{ from: '/admin' }} />;
    }

    // 3. Se estiver logado, mas não tiver o papel (role) autorizado
    if (!allowRoles.includes(user.role)) {
        toast.error("Acesso não autorizado.");
        return <Navigate to="/" replace />; // Redireciona para a Home
    }

    // 4. Se estiver pronto, logado e autorizado, renderiza o layout do admin
    // (O <Outlet> renderiza o <AdminLayout> que definimos no AppRoutes)
    return <Outlet />;
};

export default AdminRoute;