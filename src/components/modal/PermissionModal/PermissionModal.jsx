import React, { useState, useEffect } from 'react';
import styles from './PermissionModal.module.css';
import { FaTimes, FaSpinner, FaUser, FaUserTie, FaUserShield } from 'react-icons/fa';
// --- CORREÇÃO AQUI ---
import { MASTER_PERMISSIONS_LIST, ROLE_TEMPLATES } from '../../../config/permissions';
// --------------------

const PermissionModal = ({ user, onClose, onSave, isSubmitting }) => {
    const [role, setRole] = useState(user.role || 'user');
    const [permissions, setPermissions] = useState(user.permissions || {});

    // Efeito que "reseta" as permissões ao mudar o dropdown de Perfil
    const handleRoleTemplateChange = (e) => {
        const newRole = e.target.value;
        setRole(newRole);
        setPermissions(ROLE_TEMPLATES[newRole]);
    };

    // Handler para os checkboxes individuais
    const handlePermissionChange = (permissionId) => {
        const newPermissions = { ...permissions };
        
        if (newPermissions[permissionId]) {
            delete newPermissions[permissionId]; // Desmarca
        } else {
            newPermissions[permissionId] = true; // Marca
        }
        setPermissions(newPermissions);
    };

    const handleSubmit = async () => {
        const dataToSave = {
            role: role,
            permissions: permissions // Salva o objeto de permissões
        };
        await onSave(user.uid, dataToSave);
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}><FaTimes /></button>
                <h2 className={styles.title}>Editar Permissões</h2>
                
                <div className={styles.userInfo}>
                    <p>Usuário: <strong>{user.displayName || user.email}</strong></p>
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="roleSelect">Perfil Base (Modelo)</label>
                    <select
                        id="roleSelect"
                        value={role}
                        onChange={handleRoleTemplateChange}
                        className={styles.select}
                    >
                        <option value="user">Cliente</option>
                        <option value="vendedor">Vendedor</option>
                        <option value="admin">Administrador</option>
                    </select>
                    <small>Mudar o perfil base redefine as permissões abaixo.</small>
                </div>

                <div className={styles.formGroup}>
                    <label>Permissões Individuais (Customizadas)</label>
                    <div className={styles.permissionGrid}>
                        {MASTER_PERMISSIONS_LIST.map(perm => (
                            <label key={perm.id} className={styles.checkboxLabel}>
                                <input 
                                    type="checkbox"
                                    checked={!!permissions[perm.id]}
                                    onChange={() => handlePermissionChange(perm.id)}
                                />
                                {perm.label}
                            </label>
                        ))}
                    </div>
                </div>

                <div className={styles.actions}>
                    <button onClick={onClose} className={styles.btnCancel}>Cancelar</button>
                    <button onClick={handleSubmit} className={styles.btnSubmit} disabled={isSubmitting}>
                        {isSubmitting ? <FaSpinner className={styles.spinner} /> : "Salvar Permissões"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PermissionModal;