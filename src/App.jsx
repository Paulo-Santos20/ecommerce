import React, { useEffect } from 'react';
import AppRoutes from './routes/AppRoutes';
import { useAuthStore } from './store/useAuthStore';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/**
 * Componente App Raiz.
 * Responsável por:
 * 1. Renderizar o container de Toasts (Notificações)
 * 2. Inicializar o listener de autenticação (useAuthStore).
 * 3. Renderizar o sistema de rotas (AppRoutes).
 */
function App() {
  // Pega a AÇÃO de 'ouvir' do store
  const listenToAuthChanges = useAuthStore(
    (state) => state.listenToAuthChanges
  );

  // Executa o listener UMA VEZ quando o App é montado
  useEffect(() => {
    const unsubscribe = listenToAuthChanges(); 
    
    // Opcional: Desliga o ouvinte quando o App "morre"
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [listenToAuthChanges]);

  return (
    <>
      {/* Container global para notificações (toasts) */}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <AppRoutes />
    </>
  );
}

export default App;