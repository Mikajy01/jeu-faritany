/**
 * Use Case: RequestRematch
 */
export const requestRematchUseCase = ({ socketService, addLogEntry }) => {
  socketService.emit("resetGame");
  addLogEntry("Vous avez proposé une revanche.");
};
