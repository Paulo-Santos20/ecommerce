import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import Loading from '../../components/ui/Loading/Loading';
import { toast } from 'react-toastify';
import SunEditor from 'suneditor-react';
import 'suneditor/dist/css/suneditor.min.css'; 
import styles from './AdminPageEditor.module.css';
import { FaSpinner } from 'react-icons/fa';

// Configurações do Editor (Toolbar)
const editorOptions = {
  buttonList: [
    ['undo', 'redo'],
    ['font', 'fontSize', 'formatBlock'],
    ['bold', 'italic', 'underline', 'strike'],
    ['fontColor', 'hiliteColor'],
    ['align', 'list', 'indent', 'outdent'],
    ['link', 'image', 'video'],
    ['removeFormat'],
    ['fullScreen', 'codeView']
  ],
};

const AdminPageEditor = () => {
    const { slug } = useParams(); 
    const navigate = useNavigate();
    
    const [title, setTitle] = useState('');
    const [content, setContent] = useState(''); 
    const [pageSlug, setPageSlug] = useState(slug || ''); 
    const [isNewPage, setIsNewPage] = useState(!slug); 
    const [showInMenu, setShowInMenu] = useState(false);
    const [loading, setLoading] = useState(!isNewPage); 
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Busca os dados da página se estiver editando
    useEffect(() => {
        if (isNewPage) return;

        const fetchPageData = async () => {
            setLoading(true);
            try {
                const pageRef = doc(db, 'pages', pageSlug);
                const docSnap = await getDoc(pageRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setTitle(data.title || '');
                    setContent(data.content || '');
                    setShowInMenu(data.showInMenu || false); 
                } else {
                    toast.error("Página não encontrada. Criando uma nova...");
                    setIsNewPage(true); 
                    setPageSlug('');
                }
            } catch (error) {
                toast.error("Erro ao carregar página.");
            } finally {
                setLoading(false);
            }
        };
        fetchPageData();
    }, [pageSlug, isNewPage]);
    
    // Handler para salvar
    const handleSave = async () => {
        const finalSlug = pageSlug.toLowerCase().trim().replace(/\s+/g, '-');
        if (finalSlug === '' || title === '') {
            toast.error("O Título e o Slug da URL são obrigatórios.");
            return;
        }

        setIsSubmitting(true);
        try {
            const pageRef = doc(db, 'pages', finalSlug);
            await setDoc(pageRef, {
                title: title,
                content: content,
                showInMenu: showInMenu, 
                updatedAt: serverTimestamp()
            }, { merge: true }); 

            toast.success("Página salva com sucesso!");
            navigate('/admin/paginas'); 

        } catch (error) {
            console.error("Erro ao salvar página:", error);
            toast.error("Falha ao salvar a página.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <Loading />;

    return (
        <div className={styles.editorPage}>
            {/* O BOTÃO ESTÁ AQUI */}
            <div className={styles.pageHeader}>
                <h1>{isNewPage ? 'Criar Nova Página' : `Editando: ${title}`}</h1>
                <button onClick={handleSave} className={styles.saveButton} disabled={isSubmitting}>
                    {isSubmitting ? <FaSpinner className={styles.spinner} /> : 'Salvar Página'}
                </button>
            </div>
            {/* FIM DO BOTÃO */}
            
            <div className={styles.formContainer}>
                {/* Inputs de Título e Slug */}
                <div className={styles.formRow}>
                    <div className={styles.formGroup} style={{flex: 2}}>
                        <label htmlFor="title">Título da Página</label>
                        <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className={styles.formGroup} style={{flex: 1}}>
                        <label htmlFor="slug">Slug da URL (ex: sobre-nos)</label>
                        <input id="slug" value={pageSlug} onChange={(e) => setPageSlug(e.target.value)} disabled={!isNewPage} />
                        {!isNewPage && <small>O slug não pode ser alterado após a criação.</small>}
                    </div>
                </div>
                
                {/* Checkbox "Mostrar no menu" */}
                <div className={styles.formGroup}>
                     <label className={styles.checkboxLabel}>
                        <input 
                            type="checkbox"
                            checked={showInMenu}
                            onChange={(e) => setShowInMenu(e.target.checked)}
                        />
                        Mostrar esta página no dropdown 'Minha Conta' do cabeçalho
                    </label>
                </div>
                
                {/* O Editor */}
                <div className={styles.formGroup}>
                    <label>Conteúdo da Página</label>
                    <SunEditor 
                        setOptions={editorOptions}
                        setContents={content}
                        onChange={setContent}
                        height="400"
                    />
                </div>
            </div>
        </div>
    );
};

export default AdminPageEditor;