import { GameState } from "../../domain/entities/GameState";

/**
 * Use Case: LeaveRoom
 */
export const leaveRoomUseCase = ({
  socketService,
  setGameState,
  addLogEntry,
}) => {
  socketService.emit("leaveRoom");
  localStorage.removeItem("faritany_current_game");
  localStorage.removeItem("faritany_current_game_type");

  // Reset state to default
  setGameState(new GameState());

  addLogEntry("Vous avez quitté la salle.");
};
