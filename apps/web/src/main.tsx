import React from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import { App } from './App';
import { AppProviders } from './providers';

const rootElement = document.querySelector('#root');

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>,
);
