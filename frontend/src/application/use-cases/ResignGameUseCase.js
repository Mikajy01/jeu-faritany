/**
 * Use Case: ResignGame
 */
export const resignGameUseCase = ({ socketService, addLogEntry, gameState }) => {
  if (gameState && !gameState.gameActive) {
    console.warn("Impossible d'abandonner : la partie n'est pas active.");
    return;
  }
  
  socketService.emit("resignGame");
  addLogEntry("Vous avez abandonné la partie.");
};
