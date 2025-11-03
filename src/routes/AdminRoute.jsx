import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import Loading from '../components/ui/Loading/Loading';
// A 'toast' foi removida para corrigir o erro "Maximum update depth"

/**
 * Rota Protegida (Guarda de Rota) para o CMS.
 * ATUALIZADO: Verifica o 'role' (antigo) E o OBJETO 'permissions' (novo).
 */
const AdminRoute = () => {
    
    // Seletores individuais para evitar loop infinito
    const user = useAuthStore((state) => state.user);
    const isAuthReady = useAuthStore((state) => state.isAuthReady);

    // 1. Espera o Firebase Auth estar pronto
    if (!isAuthReady) {
        return <Loading />;
    }

    // 2. Se estiver pronto, mas não logado
    if (!user) {
        return <Navigate to="/login" replace state={{ from: '/admin' }} />;
    }

    // --- 3. CORREÇÃO DA LÓGICA DE PERMISSÃO ---
    //
    // Verificação 1: O usuário tem o 'role' "admin" (sistema antigo/legado)?
    // Isso é a "chave mestra" para o primeiro login.
    const isLegacyAdmin = user.role === 'admin';
    
    // Verificação 2: O usuário tem o NOVO objeto de permissões?
    // Acessa a *chave* 'can_view_dashboard' no *objeto* 'permissions'.
    const hasDashboardPermission = user.permissions && user.permissions.can_view_dashboard;
    
    // Se o usuário for um admin "legado" (como você, antes de se atualizar)
    // OU tiver a nova permissão, ele pode entrar.
    if (isLegacyAdmin || hasDashboardPermission) {
        return <Outlet />; // Renderiza o <AdminLayout>
    }
    // --- FIM DA CORREÇÃO ---

    // 4. Se não for nenhum dos dois, é um usuário comum. Redireciona para a Home.
    return <Navigate to="/" replace />;
};

export default AdminRoute;