import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#1a2544',
          color: '#f1f5f9',
          border: '1px solid #2a3a6e',
        },
        success: { iconTheme: { primary: '#22c55e', secondary: '#1a2544' } },
        error: { iconTheme: { primary: '#ef4444', secondary: '#1a2544' } },
      }}
    />
  </React.StrictMode>
);
