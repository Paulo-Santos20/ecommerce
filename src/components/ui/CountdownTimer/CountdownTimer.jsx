import React, { useState, useEffect } from 'react';
import styles from './CountdownTimer.module.css';

/**
 * Função helper para calcular o tempo restante
 */
const calculateTimeLeft = (expiryDate) => {
  const difference = expiryDate.getTime() - new Date().getTime();
  let timeLeft = {};

  if (difference > 0) {
    timeLeft = {
      dias: Math.floor(difference / (1000 * 60 * 60 * 24)),
      horas: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutos: Math.floor((difference / 1000 / 60) % 60),
      segundos: Math.floor((difference / 1000) % 60),
    };
  } else {
    // A oferta expirou
    timeLeft = null; 
  }

  return timeLeft;
};

/**
 * Componente Reutilizável de Contagem Regressiva
 * Recebe uma data de expiração (JS Date object) e faz a contagem.
 * (Princípio: Código de Alta Qualidade)
 */
const CountdownTimer = ({ expiryDate }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(expiryDate));

  useEffect(() => {
    // Define um timer para atualizar a cada segundo
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(expiryDate);
      if (newTimeLeft) {
        setTimeLeft(newTimeLeft);
      } else {
        // A oferta acabou, limpa o timer
        clearInterval(timer);
        setTimeLeft(null);
      }
    }, 1000);

    // Função de limpeza (cleanup) do useEffect
    // Isso previne memory leaks quando o componente é desmontado
    return () => clearInterval(timer);
  }, [expiryDate]); // Re-executa se a data de expiração mudar

  if (!timeLeft) {
    return <span className={styles.countdownExpired}>Oferta Encerrada!</span>;
  }

  // Helper para formatar números (ex: 7 -> 07)
  const pad = (num) => String(num).padStart(2, '0');

  return (
    <span className={styles.timer}>
      {/* Mostra dias apenas se for mais que 0 */}
      {timeLeft.dias > 0 && <span>{timeLeft.dias}d </span>}
      <span>{pad(timeLeft.horas)}h </span>
      <span>{pad(timeLeft.minutos)}m </span>
      <span>{pad(timeLeft.segundos)}s</span>
    </span>
  );
};

export default CountdownTimer;