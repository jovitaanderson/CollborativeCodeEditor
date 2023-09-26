import React from 'react';
import './App.css';
import VideoChat from './components/VideoChat';
import VideoConnect from './components/VideoConnect';
import Lobby from './components/lobby';
import { BrowserRouter, Route, Routes } from "react-router-dom";


function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/room" element={<VideoConnect />} />
        </Routes>
      </BrowserRouter>

  );
}


export default App;
