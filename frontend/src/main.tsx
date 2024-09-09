import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import App from './App.tsx'
import Chats from './components/Chat.tsx'
import './index.css'
import Register from './components/Register.tsx';
import Login from './components/Login.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/chats" element={<Chats />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        {/* Define other routes here */}
      </Routes>
    </Router>
  </StrictMode>,
)
