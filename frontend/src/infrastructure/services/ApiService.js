const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5555";

class ApiService {
  async fetchPublicRooms() {
    try {
      const response = await fetch(`${API_URL}/game/public-rooms`);
      if (response.ok) {
        return await response.json();
      }
      throw new Error("Impossible de récupérer les salles publiques");
    } catch (err) {
      console.error("❌ ApiService.fetchPublicRooms:", err);
      throw err;
    }
  }

  async validateJoin(gameId, userId, joinCode = null) {
    const response = await fetch(`${API_URL}/game/validate-join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, userId, joinCode }),
    });
    if (!response.ok) throw new Error("Erreur validation jointure");
    const data = await response.json();
    return data;
  }

  async createRoom(settings) {
    const response = await fetch(`${API_URL}/game/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (!response.ok) throw new Error("Erreur lors de la création de la salle");
    return await response.json();
  }

  async joinPublicRoom(settings) {
    const response = await fetch(`${API_URL}/game/join-public`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (!response.ok) throw new Error("Erreur matchmaking");
    return await response.json();
  }

  async getRoomInfo(gameId) {
    const response = await fetch(`${API_URL}/game/room/${gameId}`);
    if (!response.ok) {
      if (response.status === 404) throw new Error("Salle introuvable.");
      throw new Error("Erreur lors de la récupération des infos de la salle.");
    }
    return await response.json();
  }
}

export const apiService = new ApiService();
