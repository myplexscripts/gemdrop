import React from 'react';
import { createRoot } from 'react-dom/client';
import { createIcons, icons } from 'lucide';
import './gems/reactive-system';
import './react-app.css';
import App from './App';

window.lucide={
  createIcons:(options?:unknown)=>createIcons({
    icons,
    ...((options&&typeof options==='object')?options:{})
  })
} as unknown as typeof window.lucide;

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App/></React.StrictMode>
);
