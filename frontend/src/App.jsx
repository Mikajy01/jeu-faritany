import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LoadingScreen } from "./components/LoadingScreen";
import NotFoundPage from "./pages/NotFoundPage";
import AiRoomPage from "./pages/AiRoomPage";

// Lazy imports
const HomePage = lazy(() => import("./pages/HomePage"));
const WaitingRoomPage = lazy(() => import("./pages/WaitingRoomPage"));
const GamePage = lazy(() => import("./pages/GamePage"));
const JoinRoomPage = lazy(() => import("./pages/JoinRoomPage"));

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/waiting-room" element={<WaitingRoomPage />} />
        <Route path="/ai" element={<AiRoomPage />} />
        <Route path="/join" element={<JoinRoomPage />} />
        <Route path="/join/:code" element={<JoinRoomPage />} />
        <Route path="/game" element={<GamePage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
