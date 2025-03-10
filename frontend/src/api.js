const API_URL = 'http://localhost:8000';

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// Helper function to create headers with authorization token
const getAuthHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

// API Service for the Team Portal
const api = {
  // Authentication
  login: async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    const response = await fetch(`${API_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    const data = await response.json();
    // Store token in localStorage
    localStorage.setItem('token', data.access_token);
    return data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
  },
  
  getCurrentUser: async () => {
    const token = getToken();
    if (!token) return null;
    
    try {
      const response = await fetch(`${API_URL}/users/me`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          return null;
        }
        throw new Error('Failed to get user data');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },
  
  // Description editing
  getDescription: async (entityType, entityId) => {
    const response = await fetch(`${API_URL}/descriptions/${entityType}/${entityId}`);
    if (!response.ok) {
      throw new Error(`Failed to get ${entityType} description`);
    }
    return response.json();
  },
  
  updateDescription: async (entityType, entityId, description) => {
    const response = await fetch(`${API_URL}/descriptions/${entityType}/${entityId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ description })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Failed to update ${entityType} description`);
    }
    
    return response.json();
  },
  
  getDescriptionHistory: async (entityType, entityId) => {
    const response = await fetch(`${API_URL}/descriptions/${entityType}/${entityId}/history`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get ${entityType} description history`);
    }
    
    return response.json();
  },
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
  
  createService: async (serviceData) => {
    const response = await fetch(`${API_URL}/services`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(serviceData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create service');
    }
    
    return response.json();
  },
  
  updateService: async (serviceId, serviceData) => {
    const response = await fetch(`${API_URL}/services/${serviceId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(serviceData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update service');
    }
    
    return response.json();
  },
  
  deleteService: async (serviceId) => {
    const response = await fetch(`${API_URL}/services/${serviceId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to delete service');
    }
    
    return true;
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
  
  createDependency: async (dependencyData) => {
    const { dependent_squad_id, dependency_squad_id, ...dependencyDetails } = dependencyData;
    
    const response = await fetch(`${API_URL}/dependencies?dependent_id=${dependent_squad_id}&dependency_id=${dependency_squad_id}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(dependencyDetails)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create dependency');
    }
    
    return response.json();
  },
  
  updateDependency: async (dependencyId, dependencyData) => {
    const response = await fetch(`${API_URL}/dependencies/${dependencyId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(dependencyData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update dependency');
    }
    
    return response.json();
  },
  
  deleteDependency: async (dependencyId) => {
    const response = await fetch(`${API_URL}/dependencies/${dependencyId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to delete dependency');
    }
    
    return true;
  },
  
  // Squad Team Type
  updateSquadTeamType: async (squadId, teamType) => {
    const response = await fetch(`${API_URL}/squads/${squadId}/team-type?team_type=${teamType}`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update team type');
    }
    
    return response.json();
  },
  
  updateAreaLabel: async (areaId, label) => {
    const url = `${API_URL}/areas/${areaId}/label${
      label ? `?label=${encodeURIComponent(label)}` : ''
    }`;
      
    const response = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update area label');
    }
    
    return response.json();
  },
  
  updateTribeLabel: async (tribeId, label) => {
    const url = `${API_URL}/tribes/${tribeId}/label${
      label ? `?label=${encodeURIComponent(label)}` : ''
    }`;
      
    const response = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update tribe label');
    }
    
    return response.json();
  },

  updateSquadContactInfo: async (squadId, contactInfo) => {
    const response = await fetch(`${API_URL}/squads/${squadId}/contact-info`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(contactInfo)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update contact information');
    }
    
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
