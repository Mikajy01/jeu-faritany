/**
 * Use Case: MakeMove
 * Orchestrates placing a stone on the grid, including optimistic UI updates
 * and server notification via Socket.
 */
export const makeMoveUseCase = (
  x,
  y,
  { gameState, setGameState, socketService, lastGameStateRef },
) => {
  let success = false;

  // Validation logic (Domain-like)
  if (gameState.playerId !== gameState.currentPlayer) {
    console.warn("❌ Ce n'est pas votre tour");
    return false;
  }

  const coordKey = `${x},${y}`;
  if (gameState.grid.has(coordKey)) {
    console.warn("❌ Position déjà occupée");
    return false;
  }

  // 1. Optimistic Update
  lastGameStateRef.current = { ...gameState, grid: new Map(gameState.grid) };

  const newGrid = new Map(gameState.grid);
  newGrid.set(coordKey, gameState.currentPlayer);

  setGameState((prev) => ({
    ...prev,
    grid: newGrid,
    move: { x, y, player: prev.currentPlayer },
  }));

  // 2. Infrastructure notification
  socketService.emit("makeMove", { x, y });

  return true;
};
