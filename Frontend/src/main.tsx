// Frontend/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';

// 1. Importamos el CSS de Bootstrap (DEBE ir antes de nuestro index.css)
import 'bootstrap/dist/css/bootstrap.min.css';
// 2. Importamos nuestros estilos globales
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);