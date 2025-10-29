import React, { useState } from 'react';
import { FaPlus, FaMinus } from 'react-icons/fa';
import styles from './Accordion.module.css';

/**
 * Componente Accordion simples e reutilizável.
 * (Princípio: Código de Alta Qualidade)
 */
const Accordion = ({ title, children, startOpen = false }) => {
  const [isOpen, setIsOpen] = useState(startOpen);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={styles.accordionItem}>
      <button className={styles.accordionHeader} onClick={toggleOpen}>
        <h3 className={styles.accordionTitle}>{title}</h3>
        <span className={styles.accordionIcon}>
          {isOpen ? <FaMinus /> : <FaPlus />}
        </span>
      </button>
      {isOpen && (
        <div className={styles.accordionContent}>
          {children}
        </div>
      )}
    </div>
  );
};

export default Accordion;