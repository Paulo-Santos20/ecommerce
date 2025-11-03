import React from 'react';
// 1. Importa apenas o 'createRoot' (o jeito moderno)
import { createRoot } from 'react-dom/client'; 
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css'; 
import { SearchProvider } from './context/SearchContext';
import { SettingsProvider } from './context/SettingsContext';

// 2. Removemos todos os polyfills do 'react-dom' e 'react-dom/compat'

// 3. Usa o 'createRoot' (moderno) para renderizar a aplicação
const root = createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      {/* Provedor de Configurações (Logo, Banners, etc.) */}
      <SettingsProvider> 
        {/* Provedor de Busca (para o Header) */}
        <SearchProvider>
          <App />
        </SearchProvider>
      </SettingsProvider>
    </BrowserRouter>
  </React.StrictMode>
);