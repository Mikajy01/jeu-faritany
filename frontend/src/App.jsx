import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import GamePage from "./pages/GamePage";
import WaitingRoomPage from "./pages/WaitingRoomPage";
import AiRoomPage from "./pages/AiRoomPage";
import JoinRoomPage from "./pages/JoinRoomPage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/game" element={<GamePage />} />
      <Route path="/waiting-room" element={<WaitingRoomPage />} />
      <Route path="/ai" element={<AiRoomPage />} />
      <Route path="/join" element={<JoinRoomPage />} />
      <Route path="/join/:roomCode" element={<JoinRoomPage />} />
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

export default App;
