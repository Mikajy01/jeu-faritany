/**
 * Use Case: JoinRoom
 * Validates a room joining request via REST API and then establishes the socket connection.
 */
export const joinRoomUseCase = async (gameId, joinCode, { userId, validateJoinApi, socketService }) => {
  try {
    // 1. Validation REST
    const validation = await validateJoinApi(gameId, userId, joinCode);

    if (validation.success) {
      // 2. Connexion Socket
      socketService.emit("joinGame", {
        code: gameId,
        userId,
        joinCode: validation.joinCode || joinCode,
      });

      // 3. Stockage local (Persistence layer logic)
      localStorage.setItem("faritany_current_game", gameId);
      if (validation.joinCode) {
        localStorage.setItem(`faritany_joincode_${gameId}`, validation.joinCode);
      }
      
      return validation;
    } else {
      throw new Error(validation.error || "Impossible de rejoindre la salle.");
    }
  } catch (err) {
    console.error("❌ Erreur JoinRoomUseCase:", err);
    throw err;
  }
};
