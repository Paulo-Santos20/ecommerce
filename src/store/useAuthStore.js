import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';

/**
 * Store global para gerenciar o estado de autenticação.
 * Ouve as mudanças de auth do Firebase e atualiza o estado.
 * (Performance Total: só é acionado quando o auth muda)
 */
export const useAuthStore = create((set) => ({
  user: null,
  isAuthReady: false, // Indica se já verificamos o auth do Firebase
  
  // Ação para ser chamada no App.jsx para iniciar o listener
  listenToAuthChanges: () => {
    onAuthStateChanged(auth, (user) => {
      set({ user: user, isAuthReady: true });
    });
  },
}));