import React from 'react';
import { createRoot } from 'react-dom/client';
import { createIcons } from 'lucide';
import '../../reactive-gem-system.js';
import './react-app.css';
import App from './App';

window.lucide={createIcons} as unknown as typeof window.lucide;

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App/></React.StrictMode>
);
