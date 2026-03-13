import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Chrome extension error suppression
const originalConsoleError = console.error;
console.error = function(...args) {
  const errorString = args.join(' ');
  if (errorString.includes('Could not establish connection') ||
      errorString.includes('Receiving end does not exist') ||
      errorString.includes('JSON-RPC') ||
      errorString.includes('chrome.runtime')) {
    return;
  }
  originalConsoleError.apply(console, args);
};

window.addEventListener('error', function(event) {
  const messageString = event.error?.message || '';
  const errorString = String(event.error);
  if (event.error && (
    messageString.includes('chrome.runtime.sendMessage') ||
    messageString.includes('Extension ID') ||
    messageString.includes('runtime.sendMessage') ||
    messageString.includes('Internal JSON-RPC error') ||
    messageString.includes('Could not establish connection') ||
    messageString.includes('Receiving end does not exist') ||
    errorString.includes('Could not establish connection') ||
    errorString.includes('Receiving end does not exist') ||
    (event.error.code && (event.error.code === -32603 || event.error.code === 4001 || event.error.code === -32002))
  )) {
    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();
    return true;
  }
}, true);

window.addEventListener('unhandledrejection', function(event) {
  const messageString = event.reason?.message || '';
  const reasonString = String(event.reason);
  if (event.reason && (
    messageString.includes('chrome.runtime.sendMessage') ||
    messageString.includes('Extension ID') ||
    messageString.includes('runtime.sendMessage') ||
    messageString.includes('Internal JSON-RPC error') ||
    messageString.includes('Could not establish connection') ||
    messageString.includes('Receiving end does not exist') ||
    reasonString.includes('Could not establish connection') ||
    reasonString.includes('Receiving end does not exist') ||
    (event.reason.code && (event.reason.code === -32603 || event.reason.code === 4001 || event.reason.code === -32002))
  )) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return true;
  }
}, true);

// Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error('App error:', error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Inter, sans-serif', background: '#5E76FF', color: '#fff', textAlign: 'center', padding: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Something went wrong</h1>
            <p style={{ opacity: 0.7, marginBottom: '1rem' }}>Please refresh the page and try again.</p>
            <button onClick={() => window.location.reload()} style={{ padding: '0.75rem 1.5rem', borderRadius: '100px', background: '#314085', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Refresh</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
