import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import App from './App.tsx'
// import './index.css'
import Register from './components/Register.tsx';
import Login from './components/Login.tsx';
import Home from './components/Home.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/chats" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        {/* Define other routes here */}
      </Routes>
    </Router>
  </StrictMode>,
)
