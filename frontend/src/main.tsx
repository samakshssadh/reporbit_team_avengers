import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { applyTheme, initialTheme } from './context/ThemeContext';
import './index.css';
import './theme-light.css';

applyTheme(initialTheme()); // before first paint: no flash of the wrong theme

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
