import React from 'react';
import ReactDOM from 'react-dom/client';
import './fonts'; // self-hosted fonts (same files for preview + PDF)
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
