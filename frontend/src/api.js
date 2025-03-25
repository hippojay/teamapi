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
  
  // User registration and authentication
  register: async (userData) => {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify({ response: { data: errorData } }));
    }
    
    return response.json();
  },
  
  getTokenInfo: async (token) => {
    const response = await fetch(`${API_URL}/token-info/${token}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify({ response: { data: errorData } }));
    }
    
    return response.json();
  },
  
  verifyEmail: async (email, token) => {
    const response = await fetch(`${API_URL}/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, token }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify({ response: { data: errorData } }));
    }
    
    return response.json();
  },
  
  requestPasswordReset: async (email) => {
    const response = await fetch(`${API_URL}/reset-password-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify({ response: { data: errorData } }));
    }
    
    return response.json();
  },
  
  resetPassword: async (token, newPassword) => {
    const response = await fetch(`${API_URL}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, new_password: newPassword }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify({ response: { data: errorData } }));
    }
    
    return response.json();
  },
  
  // User profile management
  updateProfile: async (userData) => {
    const response = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify({ response: { data: errorData } }));
    }
    
    return response.json();
  },
  
  changePassword: async (passwordData) => {
    // This would typically be a separate endpoint
    // but we're using the profile endpoint for simplicity
    const response = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ password: passwordData.newPassword }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify({ response: { data: errorData } }));
    }
    
    return response.json();
  },
  
  // Admin endpoints
  getUsers: async () => {
    const response = await fetch(`${API_URL}/admin/users`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to retrieve users');
    }
    
    return response.json();
  },
  
  createUser: async (userData) => {
    const response = await fetch(`${API_URL}/users/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify({ response: { data: errorData } }));
    }
    
    return response.json();
  },
  
  updateUser: async (userId, userData) => {
    const response = await fetch(`${API_URL}/admin/users/${userId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify({ response: { data: errorData } }));
    }
    
    return response.json();
  },
  
  getAdminSettings: async () => {
    const response = await fetch(`${API_URL}/admin/settings`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to retrieve settings');
    }
    
    return response.json();
  },
  
  updateAdminSetting: async (key, settingData) => {
    const response = await fetch(`${API_URL}/admin/settings/${key}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settingData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify({ response: { data: errorData } }));
    }
    
    return response.json();
  },
  
  getAuditLogs: async () => {
    const response = await fetch(`${API_URL}/admin/audit-logs`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to retrieve audit logs');
    }
    
    return response.json();
  },
  
  getExcelSheets: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_URL}/admin/get-excel-sheets`, {
      method: 'POST',
      headers: {
        'Authorization': getToken() ? `Bearer ${getToken()}` : ''
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to get Excel sheets');
    }
    
    return response.json();
  },
  
  uploadData: async (file, dataType, sheetName = null, dryRun = false) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('data_type', dataType);
    if (sheetName) {
      formData.append('sheet_name', sheetName);
    }
    formData.append('dry_run', dryRun);
    
    const response = await fetch(`${API_URL}/admin/upload-data`, {
      method: 'POST',
      headers: {
        'Authorization': getToken() ? `Bearer ${getToken()}` : ''
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to upload data');
    }
    
    return response.json();
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

  createSquad: async (squadData, tribeId) => {
    const response = await fetch(`${API_URL}/admin/squads?tribe_id=${tribeId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(squadData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create squad');
    }
    
    return response.json();
  },
  
  updateSquad: async (squadId, squadData) => {
    const response = await fetch(`${API_URL}/admin/squads/${squadId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(squadData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update squad');
    }
    
    return response.json();
  },
  
  updateSquadTribe: async (squadId, tribeId) => {
    const response = await fetch(`${API_URL}/admin/squads/${squadId}/tribe?tribe_id=${tribeId}`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to move squad to new tribe');
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
    
    // Normalize interaction_mode to ensure it's one of the accepted values
    if (dependencyDetails.interaction_mode) {
      const validModes = ['x_as_a_service', 'collaboration', 'facilitating'];
      dependencyDetails.interaction_mode = validModes.includes(dependencyDetails.interaction_mode.toLowerCase())
        ? dependencyDetails.interaction_mode.toLowerCase()
        : 'x_as_a_service';
    }
    
    try {
      const response = await fetch(`${API_URL}/dependencies?dependent_id=${dependent_squad_id}&dependency_id=${dependency_squad_id}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(dependencyDetails)
      });
      
      if (!response.ok) {
        // Try to parse the error response
        let errorMessage = 'Failed to create dependency';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          // If parsing fails, use default message
        }
        throw new Error(errorMessage);
      }
      
      return response.json();
    } catch (error) {
      console.error('Create dependency error:', error);
      throw error;
    }
  },
  
  updateDependency: async (dependencyId, dependencyData) => {
    // Normalize the dependencyData
    const normalizedData = { ...dependencyData };
    
    // Normalize interaction_mode to ensure it's one of the accepted values
    if (normalizedData.interaction_mode) {
      const validModes = ['x_as_a_service', 'collaboration', 'facilitating'];
      normalizedData.interaction_mode = validModes.includes(normalizedData.interaction_mode.toLowerCase())
        ? normalizedData.interaction_mode.toLowerCase()
        : 'x_as_a_service';
    }
    
    try {
      const response = await fetch(`${API_URL}/dependencies/${dependencyId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(normalizedData)
      });
      
      if (!response.ok) {
        // Try to parse the error response
        let errorMessage = 'Failed to update dependency';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          // If parsing fails, use default message
        }
        throw new Error(errorMessage);
      }
      
      return response.json();
    } catch (error) {
      console.error('Update dependency error:', error);
      throw error;
    }
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
  
// OKR functions
  getObjectives: async (areaId = null, tribeId = null, squadId = null) => {
    let url = `${API_URL}/objectives?`;
    if (areaId) url += `area_id=${areaId}&`;
    if (tribeId) url += `tribe_id=${tribeId}&`;
    if (squadId) url += `squad_id=${squadId}&`;
    
    const response = await fetch(url);
    return response.json();
  },
  
  getObjective: async (objectiveId) => {
    const response = await fetch(`${API_URL}/objectives/${objectiveId}`);
    if (!response.ok) {
      throw new Error('Objective not found');
    }
    return response.json();
  },
  
  createObjective: async (objectiveData) => {
    const response = await fetch(`${API_URL}/objectives`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(objectiveData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create objective');
    }
    
    return response.json();
  },
  
  updateObjective: async (objectiveId, objectiveData) => {
    const response = await fetch(`${API_URL}/objectives/${objectiveId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(objectiveData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update objective');
    }
    
    return response.json();
  },
  
  deleteObjective: async (objectiveId) => {
    const response = await fetch(`${API_URL}/objectives/${objectiveId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to delete objective');
    }
    
    return true;
  },
  
  getKeyResults: async (objectiveId = null) => {
    const url = objectiveId ? `${API_URL}/key-results?objective_id=${objectiveId}` : `${API_URL}/key-results`;
    const response = await fetch(url);
    return response.json();
  },
  
  getKeyResult: async (keyResultId) => {
    const response = await fetch(`${API_URL}/key-results/${keyResultId}`);
    if (!response.ok) {
      throw new Error('Key Result not found');
    }
    return response.json();
  },
  
  createKeyResult: async (keyResultData) => {
    const response = await fetch(`${API_URL}/key-results`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(keyResultData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create key result');
    }
    
    return response.json();
  },
  
  updateKeyResult: async (keyResultId, keyResultData) => {
    const response = await fetch(`${API_URL}/key-results/${keyResultId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(keyResultData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update key result');
    }
    
    return response.json();
  },
  
  deleteKeyResult: async (keyResultId) => {
    const response = await fetch(`${API_URL}/key-results/${keyResultId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to delete key result');
    }
    
    return true;
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
