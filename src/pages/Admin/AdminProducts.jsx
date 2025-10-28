import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import ProductForm from '../../components/forms/ProductForm/ProductForm';
import Loading from '../../components/ui/Loading/Loading';
import { FaEdit, FaTrash } from 'react-icons/fa';
import styles from './AdminProducts.module.css';

/**
 * Página de Gerenciamento de Produtos (CRUD).
 * - Lista produtos do Firestore.
 * - Permite Deletar produtos (deleteDoc).
 * - Controla a exibição de um modal/formulário para Criar e Editar.
 * (Arquitetura Escalável)
 */
const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estado para o formulário (modal)
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);

  // Função para buscar produtos, envolvida em useCallback
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productsData);
    } catch (err) {
      console.error(err);
      setError("Falha ao carregar produtos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Ação: Deletar produto
  const handleDelete = async (productId) => {
    if (!window.confirm("Tem certeza que deseja excluir este produto?")) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'products', productId));
      // (Performance) Remove o item da UI sem precisar refazer o fetch
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir o produto.");
    }
  };

  // Ação: Abrir formulário para editar
  const handleEdit = (product) => {
    setProductToEdit(product);
    setIsFormVisible(true);
  };

  // Ação: Abrir formulário para criar
  const handleAddNew = () => {
    setProductToEdit(null);
    setIsFormVisible(true);
  };

  // Ação: Fechar formulário
  const handleFormClose = () => {
    setIsFormVisible(false);
    setProductToEdit(null);
    // Atualiza a lista após salvar
    fetchProducts(); 
  };

  if (loading) return <Loading />;
  if (error) return <p className="container">{error}</p>;

  return (
    <div className="container">
      <div className={styles.adminHeader}>
        <h1 className={styles.title}>Gerenciar Produtos</h1>
        <button onClick={handleAddNew} className={styles.btnAdd}>
          Adicionar Novo Produto
        </button>
      </div>

      {/* O Formulário (Modal/Overlay) */}
      {isFormVisible && (
        <div className={styles.formOverlay}>
          <div className={styles.formContainer}>
            <ProductForm 
              productToEdit={productToEdit} 
              onFormClose={handleFormClose} 
            />
          </div>
        </div>
      )}

      {/* Tabela de Produtos */}
      <div className={styles.tableWrapper}>
        <table className={styles.productsTable}>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Categoria</th>
              <th>Preço</th>
              <th>Estoque</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="5">Nenhum produto cadastrado.</td>
              </tr>
            ) : (
              products.map(product => (
                <tr key={product.id}>
                  <td>{product.nome}</td>
                  <td>{product.categoria}</td>
                  <td>{`R$ ${product.preco}`}</td>
                  <td>{`${product.estoque} un.`}</td>
                  <td className={styles.actions}>
                    <button onClick={() => handleEdit(product)} className={styles.btnEdit}>
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className={styles.btnDelete}>
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProducts;