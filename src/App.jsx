import React, { useEffect } from 'react'; // 1. Importar useEffect
import AppRoutes from './routes/AppRoutes';
import { useAuthStore } from './store/useAuthStore'; // 2. Importar o store

/**
 * Componente App Raiz.
 * Responsável por inicializar listeners globais (como o de autenticação)
 * e renderizar o sistema de rotas.
 */
function App() {
  // 3. Pegar a AÇÃO de 'ouvir' do store
  const listenToAuthChanges = useAuthStore(
    (state) => state.listenToAuthChanges
  );

  // 4. Executar a ação UMA VEZ quando o app carregar
  useEffect(() => {
    // Isso liga o "ouvinte" do Firebase
    listenToAuthChanges(); 
  }, [listenToAuthChanges]); // O array de dependência garante que rode só uma vez

  // O AppRoutes renderiza o Layout, que renderiza o Header e as Páginas
  return <AppRoutes />;
}

export default App;