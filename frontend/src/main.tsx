import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import Register from "./components/Register.tsx";
import Login from "./components/Login.tsx";
import Home from "./components/Home.tsx";
import Settings from "./components/Settings.tsx";

createRoot(document.getElementById("root")!).render(
  <>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/chats" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  </>
);
