import { useGameContext } from "../context/GameContext";

export const useGameSocket = (onLog) => {
  const { gameState, connectionStatus, socketRef } = useGameContext();

  return { gameState, connectionStatus, socketRef };
};
