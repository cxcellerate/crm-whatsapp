import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, toast } from 'react-hot-toast';
import App from './App';
import './index.css';

// Aplica o tema salvo antes de renderizar (evita flash)
const savedTheme = (() => {
  try {
    return JSON.parse(localStorage.getItem('crm-theme') || '{}')?.state?.theme || 'dark';
  } catch {
    return 'dark';
  }
})();
document.documentElement.classList.add(savedTheme);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
      refetchIntervalInBackground: false,
      // Não retenta erros 4xx (auth, validação) — apenas 5xx e falhas de rede
      retry: (failureCount, error: any) => {
        if (error?.response?.status >= 400 && error?.response?.status < 500) return false;
        return failureCount < 2;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15_000),
    },
  },
});

// Resync quando conexão for restaurada
window.addEventListener('online', () => {
  queryClient.refetchQueries();
  toast.success('Conexão restaurada');
});

window.addEventListener('offline', () => {
  toast.error('Sem conexão com a internet');
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster position="top-right" />
    </QueryClientProvider>
  </React.StrictMode>
);
