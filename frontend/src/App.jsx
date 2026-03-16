import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import HomePage from "./pages/HomePage";
import GamePage from "./pages/GamePage";
import WaitingRoomPage from "./pages/WaitingRoomPage";
import AiRoomPage from "./pages/AiRoomPage";
import JoinRoomPage from "./pages/JoinRoomPage";
import NotFoundPage from "./pages/NotFoundPage";
import { useTheme } from "./context/ThemeContext.jsx";

function ThemeToggleFloating() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="fixed z-[9999] pointer-events-none bottom-4 right-4 lg:bottom-6 lg:right-6">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "Passer en thème clair" : "Passer en thème sombre"}
        title={isDark ? "Thème clair" : "Thème sombre"}
        className="pointer-events-auto h-11 w-11 lg:h-12 lg:w-12 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-surface)]/80 backdrop-blur-xl text-[var(--text-primary)] shadow-lg shadow-black/10 hover:bg-[var(--bg-secondary)] transition-all opacity-60 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-fuchsia)]/40"
      >
        <span className="sr-only">
          {isDark ? "Activer le thème clair" : "Activer le thème sombre"}
        </span>
        {isDark ? (
          <Sun className="h-5 w-5 mx-auto" />
        ) : (
          <Moon className="h-5 w-5 mx-auto" />
        )}
      </button>
    </div>
  );
}

function App() {
  return (
    <>
      <ThemeToggleFloating />
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
    </>
  );
}

export default App;
