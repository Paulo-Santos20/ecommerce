import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';

/**
 * Store global para gerenciar o estado de autenticação.
 * (Princípio: Código de Alta Qualidade)
 */
export const useAuthStore = create((set) => ({
  user: null,
  isAuthReady: false, // <-- Este é o flag que corrige o bug
  
  /**
   * Ativa o "ouvinte" do Firebase Auth.
   * Quando o status do usuário muda (login/logout/carregamento inicial),
   * ele atualiza o estado e marca o 'isAuthReady' como true.
   */
  listenToAuthChanges: () => {
    // onAuthStateChanged retorna uma função 'unsubscribe'
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Quando o Firebase responde, definimos o usuário e marcamos como "pronto"
      set({ user: user, isAuthReady: true }); 
    });
    // Retorna o 'unsubscribe' para limpeza (se necessário)
    return unsubscribe; 
  },
}));