import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import Admin from './pages/Admin';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/game" element={<Game />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
