import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';
import { DataRefreshProvider } from './context/DataRefreshContext.jsx';
import { ToastProvider } from './components/ui/Toast.jsx';
import { ErrorBoundary } from './components/ui/ErrorBoundary.jsx';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <ToastProvider>
            <SettingsProvider>
              <DataRefreshProvider>
                <App />
              </DataRefreshProvider>
            </SettingsProvider>
          </ToastProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
