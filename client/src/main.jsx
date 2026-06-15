import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AppProvider } from './context/AppContext.jsx'

// Global fetch interceptor to route API requests directly to Railway in production
// and ensure cross-site cookies are transmitted successfully.
const originalFetch = window.fetch;
window.fetch = function (input, init) {
  let url = typeof input === 'string' ? input : input.url;

  if (url.startsWith('/api/')) {
    if (import.meta.env.PROD) {
      const backendUrl = 'https://telecloud-production-ab69.up.railway.app';
      url = `${backendUrl}${url}`;
    }
    init = init || {};
    init.credentials = 'include';
  }

  if (typeof input === 'string') {
    return originalFetch(url, init);
  } else {
    // Recreate the Request object with modified URL and credentials option
    const newRequest = new Request(url, {
      ...input,
      credentials: 'include'
    });
    return originalFetch(newRequest, init);
  }
};


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registered:', reg.scope))
      .catch(err => console.error('Service Worker registration failed:', err));
  });
}
