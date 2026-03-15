/**
 * Use Case: CreateRoom
 * Calls the REST API to create a new game room.
 */
export const createRoomUseCase = async (settings, { createRoomApi }) => {
  try {
    const data = await createRoomApi(settings);
    console.log("✅ Salle créée via REST (UseCase):", data);
    return data; // { gameId, type, joinCode }
  } catch (err) {
    console.error("❌ Erreur CreateRoomUseCase:", err);
    throw err;
  }
};
