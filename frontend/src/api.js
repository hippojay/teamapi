const API_URL = 'http://localhost:8000';

// API Service for the Team Portal
const api = {
  // Areas
  getAreas: async () => {
    const response = await fetch(`${API_URL}/areas`);
    return response.json();
  },
  
  getArea: async (areaId) => {
    const response = await fetch(`${API_URL}/areas/${areaId}`);
    if (!response.ok) {
      throw new Error('Area not found');
    }
    return response.json();
  },
  
  // Tribes
  getTribes: async (areaId = null) => {
    const url = areaId ? `${API_URL}/tribes?area_id=${areaId}` : `${API_URL}/tribes`;
    const response = await fetch(url);
    return response.json();
  },
  
  getTribe: async (tribeId) => {
    const response = await fetch(`${API_URL}/tribes/${tribeId}`);
    if (!response.ok) {
      throw new Error('Tribe not found');
    }
    return response.json();
  },
  
  // Squads
  getSquads: async (tribeId = null) => {
    const url = tribeId ? `${API_URL}/squads?tribe_id=${tribeId}` : `${API_URL}/squads`;
    const response = await fetch(url);
    return response.json();
  },
  
  getSquad: async (squadId) => {
    const response = await fetch(`${API_URL}/squads/${squadId}`);
    if (!response.ok) {
      throw new Error('Squad not found');
    }
    return response.json();
  },
  
  // Team Members
  getTeamMembers: async (squadId = null) => {
    const url = squadId ? `${API_URL}/team-members?squad_id=${squadId}` : `${API_URL}/team-members`;
    const response = await fetch(url);
    return response.json();
  },
  
  getTeamMember: async (memberId) => {
    const response = await fetch(`${API_URL}/team-members/${memberId}`);
    if (!response.ok) {
      throw new Error('Team member not found');
    }
    return response.json();
  },
  
  // Services
  getServices: async (squadId = null) => {
    const url = squadId ? `${API_URL}/services?squad_id=${squadId}` : `${API_URL}/services`;
    const response = await fetch(url);
    return response.json();
  },
  
  getService: async (serviceId) => {
    const response = await fetch(`${API_URL}/services/${serviceId}`);
    if (!response.ok) {
      throw new Error('Service not found');
    }
    return response.json();
  },
  
  // Dependencies
  getDependencies: async (squadId) => {
    const response = await fetch(`${API_URL}/dependencies/${squadId}`);
    return response.json();
  },
  
  getAllDependencies: async () => {
    const response = await fetch(`${API_URL}/dependencies`);
    return response.json();
  },
  
  // On-Call Roster
  getOnCall: async (squadId) => {
    try {
      const response = await fetch(`${API_URL}/on-call/${squadId}`);
      if (!response.ok) {
        return null;
      }
      return response.json();
    } catch (error) {
      console.error("Error fetching on-call data:", error);
      return null;
    }
  },
  
  // Search
  search: async (query) => {
    // Only search if query is at least 3 characters
    if (!query || query.length < 3) {
      return { results: [], total: 0 };
    }
    
    try {
      // Ensure query is properly encoded
      const encodedQuery = encodeURIComponent(query.trim());
      const response = await fetch(`${API_URL}/search?q=${encodedQuery}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error performing search:', error);
      return { results: [], total: 0 };
    }
  }
};

export default api;
