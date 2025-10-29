import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import ProductForm from '../../components/forms/ProductForm/ProductForm';
import Loading from '../../components/ui/Loading/Loading';
import { FaEdit, FaTrash, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import styles from './AdminProducts.module.css';

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

/**
 * Página de Gerenciamento de Produtos (CRUD).
 * ATUALIZADO: Busca categorias e exibe a nova estrutura de variantes.
 */
const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Buscar Produtos
      const productsQuery = query(collection(db, 'products'), orderBy('nome'));
      const productsSnapshot = await getDocs(productsQuery);
      const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productsData);

      // 2. Buscar Categorias
      const categoriesQuery = query(collection(db, 'categories'), orderBy('nome'));
      const categoriesSnapshot = await getDocs(categoriesQuery);
      const categoriesData = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(categoriesData);

    } catch (err) {
      console.error(err);
      setError("Falha ao carregar dados. Verifique as regras do Firestore.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (productId) => {
    if (!window.confirm("Tem certeza que deseja excluir este produto?")) return;
    try {
      await deleteDoc(doc(db, 'products', productId));
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir o produto.");
    }
  };

  const handleEdit = (product) => {
    setProductToEdit(product);
    setIsFormVisible(true);
  };
  const handleAddNew = () => {
    setProductToEdit(null);
    setIsFormVisible(true);
  };
  const handleFormClose = () => {
    setIsFormVisible(false);
    setProductToEdit(null);
    fetchData(); 
  };

  if (loading) return <Loading />;
  if (error) return <p className="container">{error}</p>;

  return (
    <div className="container">
      <div className={styles.adminHeader}>
        <h1 className={styles.title}>Gerenciar Produtos</h1>
        <button onClick={handleAddNew} className={styles.btnAdd}>Adicionar Novo Produto</button>
      </div>

      {isFormVisible && (
        <div className={styles.formOverlay}>
          <div className={styles.formContainer}>
            <ProductForm 
              productToEdit={productToEdit} 
              categories={categories}
              onFormClose={handleFormClose} 
            />
          </div>
        </div>
      )}

      {/* Tabela de Produtos Atualizada */}
      <div className={styles.tableWrapper}>
        <table className={styles.productsTable}>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Categoria</th>
              <th>Promo?</th>
              <th>Variantes (SKUs)</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan="5">Nenhum produto cadastrado.</td></tr>
            ) : (
              products.map(product => (
                <tr key={product.id}>
                  <td>{product.nome}</td>
                  <td>{product.categoria}</td>
                  <td>
                    {product.onSale ? 
                      <FaCheckCircle className={styles.iconSale} /> : 
                      <FaTimesCircle className={styles.iconNoSale} />}
                  </td>
                  <td>
                    {product.variants?.map((v, i) => (
                      <span key={i} className={styles.variantTag}>
                        {v.color} / {v.size} / {formatCurrency(v.price)} / {v.stock} un.
                      </span>
                    ))}
                  </td>
                  <td className={styles.actions}>
                    <button onClick={() => handleEdit(product)} className={styles.btnEdit}><FaEdit /></button>
                    <button onClick={() => handleDelete(product.id)} className={styles.btnDelete}><FaTrash /></button>
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