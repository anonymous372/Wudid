import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const token = localStorage.getItem('wudid_jwt');
  let [resource, config] = args;
  
  if (typeof resource === 'string') {
    const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
    resource = resource.replace('http://localhost:3001', apiBase);
  }
  
  if (token && typeof resource === 'string' && resource.includes('/api/')) {
    config = config || {};
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`
    };
  }
  
  const response = await originalFetch(resource, config);
  
  if (response.status === 401 && typeof resource === 'string' && !resource.includes('/api/auth')) {
    localStorage.removeItem('wudid_jwt');
    window.location.href = '/login';
  }
  
  return response;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
