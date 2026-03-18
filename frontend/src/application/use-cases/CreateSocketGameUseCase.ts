/**
 * Use Case: CreateSocketGame
 * Calls the Socket event to create a new game room (usually for AI).
 */
export const createSocketGameUseCase = (params, { socketService, addLogEntry }) => {
  socketService.emit("createGame", params);
  if (params.type === "AI") {
    addLogEntry(`Initialisation du duel contre l'IA...`);
  } else {
    addLogEntry(`Initialisation de la salle ${params.type}...`);
  }
};
