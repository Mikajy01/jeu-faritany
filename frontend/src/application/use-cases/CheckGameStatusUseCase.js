/**
 * Use Case: CheckGameStatus
 * Checks the status of a saved game in localStorage with the backend.
 */
export const checkGameStatusUseCase = async ({
  getRoomInfoApi,
  validateJoinApi,
  userId,
}) => {
  const savedGameId = localStorage.getItem("faritany_current_game");
  if (!savedGameId) return null;

  try {
    console.log(
      "🔍 Vérification du statut de la partie sauvegardée:",
      savedGameId,
    );
    const room = await getRoomInfoApi(savedGameId);

    // Si la partie est terminée, on nettoie
    if (room.gameOver) {
      console.log("🏁 La partie sauvegardée est terminée.");
      localStorage.removeItem("faritany_current_game");
      return null;
    }

    // Valider si on peut toujours rejoindre (rejoin)
    const joinCode = localStorage.getItem(`faritany_joincode_${savedGameId}`);
    const validation = await validateJoinApi(savedGameId, userId, joinCode);

    if (!validation.success) {
      console.warn(
        "⚠️ Impossible de se reconnecter à la partie:",
        validation.error,
      );
      localStorage.removeItem("faritany_current_game");
      return null;
    }

    if (validation.joinCode) {
      localStorage.setItem(
        `faritany_joincode_${savedGameId}`,
        validation.joinCode,
      );
    }

    return {
      gameId: savedGameId,
      gameActive: validation.gameActive,
      playerNumber: validation.playerNumber,
      isRejoin: validation.isRejoin,
    };
  } catch (err) {
    console.error("❌ Erreur lors de la vérification du statut:", err);
    return null;
  }
};
