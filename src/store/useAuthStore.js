import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase/config'; // Importa db
import { doc, getDoc } from 'firebase/firestore'; // Importa getDoc

/**
 * Store global para gerenciar o estado de autenticação.
 * (Princípio: Código de Alta Qualidade)
 * ATUALIZADO: Agora busca os dados do usuário (incluindo 'role') no Firestore.
 */
export const useAuthStore = create((set) => ({
  user: null, // Armazenará { uid, email, displayName, role, ... }
  isAuthReady: false, // <-- Este é o flag que corrige o bug
  
  /**
   * Ativa o "ouvinte" do Firebase Auth.
   * Quando o status do usuário muda (login/logout/carregamento inicial),
   * ele atualiza o estado e marca o 'isAuthReady' como true.
   */
  listenToAuthChanges: () => {
    // onAuthStateChanged retorna uma função 'unsubscribe'
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        // --- Usuário está logado ---
        // 1. Busca o documento correspondente no Firestore
        const userRef = doc(db, 'users', authUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          // 2. Mescla os dados do Auth e do Firestore
          set({ 
            user: {
              uid: authUser.uid,
              email: authUser.email,
              displayName: authUser.displayName, // Pega o nome do Auth (mais recente)
              ...userSnap.data() // Inclui 'cpf', 'role', 'telefone', etc.
            }, 
            isAuthReady: true 
          });
        } else {
          // Usuário existe no Auth, mas não no Firestore (caso de login social novo)
          set({
            user: {
              uid: authUser.uid,
              email: authUser.email,
              displayName: authUser.displayName,
              role: 'user' // Papel padrão
            },
            isAuthReady: true
          });
        }
      } else {
        // --- Usuário está deslogado ---
        set({ user: null, isAuthReady: true }); 
      }
    });
    return unsubscribe; 
  },
}));