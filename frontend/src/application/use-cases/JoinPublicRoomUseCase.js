/**
 * Use Case: JoinPublicRoom
 * Calls the REST API to join a public game room (matchmaking).
 */
export const joinPublicRoomUseCase = async (
  settings,
  { userId, joinPublicRoomApi },
) => {
  try {
    const data = await joinPublicRoomApi({ ...settings, userId });
    console.log("✅ Matchmaking via REST (UseCase):", data);
    return data; // { gameId, gameType, isNew, playerNumber }
  } catch (err) {
    console.error("❌ Erreur JoinPublicRoomUseCase:", err);
    throw err;
  }
};
