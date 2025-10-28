import React from 'react';

// Estilização simples inline para o fallback de carregamento
const loadingStyles = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: 'calc(100vh - var(--header-height))',
  fontSize: '1.8rem',
  color: 'var(--color-primary)',
};

const Loading = () => {
  return (
    <div style={loadingStyles}>
      <h2>Carregando Fina Estampa...</h2>
    </div>
  );
};

export default Loading;