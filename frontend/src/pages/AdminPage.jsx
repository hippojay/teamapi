import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Check, X, Edit, Search, User, Settings, History, Shield, Plus, Save } from 'lucide-react';
import { isAdmin, formatRole, getRoleBadgeClasses } from '../utils/roleUtils';
import api from '../api';

const AdminPage = () => {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchText, setSearchText] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editingSettings, setEditingSettings] = useState({});
  
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'guest',
    is_active: true
  });

  useEffect(() => {
    // Check if user is admin
    if (user && !isAdmin(user)) {
      navigate('/');
      return;
    }
    
    loadData();
  }, [user, navigate, activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      if (activeTab === 'users') {
        const response = await api.getUsers();
        setUsers(response);
      } else if (activeTab === 'settings') {
        const response = await api.getAdminSettings();
        setSettings(response);
      } else if (activeTab === 'audit') {
        const response = await api.getAuditLogs();
        setAuditLogs(response);
      }
    } catch (error) {
      setError('Failed to load data. Please try again.');
      console.error('Error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditUser = (user) => {
    setEditingUser({...user});
  };
  
  const handleCancelEditUser = () => {
    setEditingUser(null);
  };
  
  const handleSaveUser = async () => {
    try {
      await api.updateUser(editingUser.id, editingUser);
      loadData();
      setEditingUser(null);
    } catch (error) {
      setError('Failed to save user. Please try again.');
      console.error('Error saving user:', error);
    }
  };
  
  const handleEditSetting = (key, value) => {
    setEditingSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const handleSaveSetting = async (key, description) => {
    try {
      await api.updateAdminSetting(key, {
        value: editingSettings[key],
        description
      });
      
      loadData();
      setEditingSettings(prev => {
        const newSettings = {...prev};
        delete newSettings[key];
        return newSettings;
      });
    } catch (error) {
      setError('Failed to save setting. Please try again.');
      console.error('Error saving setting:', error);
    }
  };
  
  const handleAddUser = async () => {
    try {
      await api.createUser(newUser);
      setShowAddUserModal(false);
      setNewUser({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'guest',
        is_active: true
      });
      loadData();
    } catch (error) {
      setError('Failed to create user. Please try again.');
      console.error('Error creating user:', error);
    }
  };
  
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchText.toLowerCase()) ||
    (user.username && user.username.toLowerCase().includes(searchText.toLowerCase())) ||
    (user.first_name && user.first_name.toLowerCase().includes(searchText.toLowerCase())) ||
    (user.last_name && user.last_name.toLowerCase().includes(searchText.toLowerCase()))
  );

  return (
    <div className={`container mx-auto mt-16 p-6 ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {/* Tabs */}
      <div className="flex mb-6 border-b">
        <button
          className={`py-2 px-4 text-center ${
            activeTab === 'users'
              ? `border-b-2 ${darkMode ? 'border-blue-400 text-blue-400' : 'border-blue-600 text-blue-600'}`
              : `${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'}`
          }`}
          onClick={() => setActiveTab('users')}
        >
          <User className="h-4 w-4 mr-1 inline-block" />
          Users
        </button>
        
        <button
          className={`py-2 px-4 text-center ${
            activeTab === 'settings'
              ? `border-b-2 ${darkMode ? 'border-blue-400 text-blue-400' : 'border-blue-600 text-blue-600'}`
              : `${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'}`
          }`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings className="h-4 w-4 mr-1 inline-block" />
          Settings
        </button>
        
        <button
          className={`py-2 px-4 text-center ${
            activeTab === 'audit'
              ? `border-b-2 ${darkMode ? 'border-blue-400 text-blue-400' : 'border-blue-600 text-blue-600'}`
              : `${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'}`
          }`}
          onClick={() => setActiveTab('audit')}
        >
          <History className="h-4 w-4 mr-1 inline-block" />
          Audit Logs
        </button>
      </div>
      
      {error && (
        <div className={`mb-4 p-3 ${darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-700'} rounded-md`}>
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <>
          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="relative w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className={`pl-10 pr-4 py-2 w-full rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      darkMode 
                        ? 'bg-dark-tertiary border-dark-border text-dark-primary' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className={`flex items-center px-3 py-2 rounded-md text-white ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add User
                </button>
              </div>
              
              <div className={`overflow-x-auto rounded-lg border ${darkMode ? 'border-dark-border' : 'border-gray-200'}`}>
                <table className={`min-w-full divide-y ${darkMode ? 'divide-dark-border' : 'divide-gray-200'}`}>
                  <thead className={darkMode ? 'bg-dark-tertiary' : 'bg-gray-50'}>
                    <tr>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>User</th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Email</th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Role</th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Status</th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Created</th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`${darkMode ? 'divide-y divide-dark-border' : 'divide-y divide-gray-200'}`}>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center">No users found</td>
                      </tr>
                    ) : (
                      filteredUsers.map(userItem => (
                        <tr key={userItem.id} className={darkMode ? 'bg-dark-secondary' : 'bg-white'}>
                          {editingUser && editingUser.id === userItem.id ? (
                            // Editing mode
                            <>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col">
                                  <input
                                    type="text"
                                    value={editingUser.username || ''}
                                    onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                                    placeholder="Username"
                                    className={`px-2 py-1 rounded border mb-1 ${
                                      darkMode 
                                        ? 'bg-dark-tertiary border-dark-border text-dark-primary' 
                                        : 'bg-white border-gray-300 text-gray-900'
                                    }`}
                                  />
                                  <div className="flex space-x-1">
                                    <input
                                      type="text"
                                      value={editingUser.first_name || ''}
                                      onChange={(e) => setEditingUser({...editingUser, first_name: e.target.value})}
                                      placeholder="First name"
                                      className={`px-2 py-1 rounded border w-1/2 ${
                                        darkMode 
                                          ? 'bg-dark-tertiary border-dark-border text-dark-primary' 
                                          : 'bg-white border-gray-300 text-gray-900'
                                      }`}
                                    />
                                    <input
                                      type="text"
                                      value={editingUser.last_name || ''}
                                      onChange={(e) => setEditingUser({...editingUser, last_name: e.target.value})}
                                      placeholder="Last name"
                                      className={`px-2 py-1 rounded border w-1/2 ${
                                        darkMode 
                                          ? 'bg-dark-tertiary border-dark-border text-dark-primary' 
                                          : 'bg-white border-gray-300 text-gray-900'
                                      }`}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="email"
                                  value={editingUser.email}
                                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                                  className={`px-2 py-1 rounded border ${
                                    darkMode 
                                      ? 'bg-dark-tertiary border-dark-border text-dark-primary' 
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <select
                                  value={editingUser.role}
                                  onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                                  className={`px-2 py-1 rounded border ${
                                    darkMode 
                                      ? 'bg-dark-tertiary border-dark-border text-dark-primary' 
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                >
                                  <option value="guest">Guest</option>
                                  <option value="team_member">Team Member</option>
                                  <option value="admin">Administrator</option>
                                </select>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <select
                                  value={editingUser.is_active.toString()}
                                  onChange={(e) => setEditingUser({
                                    ...editingUser, 
                                    is_active: e.target.value === 'true'
                                  })}
                                  className={`px-2 py-1 rounded border ${
                                    darkMode 
                                      ? 'bg-dark-tertiary border-dark-border text-dark-primary' 
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                >
                                  <option value="true">Active</option>
                                  <option value="false">Inactive</option>
                                </select>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {new Date(userItem.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex space-x-2">
                                  <button 
                                    onClick={handleSaveUser}
                                    className={`p-1 rounded ${
                                      darkMode 
                                        ? 'bg-green-800 text-green-200 hover:bg-green-700' 
                                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                                    }`}
                                    title="Save"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={handleCancelEditUser}
                                    className={`p-1 rounded ${
                                      darkMode 
                                        ? 'bg-red-900 text-red-200 hover:bg-red-800' 
                                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                                    }`}
                                    title="Cancel"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            // Display mode
                            <>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium">
                                  {userItem.first_name || userItem.username || '(No name)'}{userItem.last_name ? ` ${userItem.last_name}` : ''}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {userItem.username || '(No username)'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm">{userItem.email}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClasses(userItem.role, darkMode)}`}>
                                  {formatRole(userItem.role)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  userItem.is_active
                                    ? darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                                    : darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                                }`}>
                                  {userItem.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {new Date(userItem.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button 
                                  onClick={() => handleEditUser(userItem)}
                                  className={`p-1 rounded ${
                                    darkMode 
                                      ? 'bg-blue-800 text-blue-200 hover:bg-blue-700' 
                                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                  }`}
                                  title="Edit user"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Add User Modal */}
              {showAddUserModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className={`rounded-lg shadow-xl w-full max-w-md p-6 ${darkMode ? 'bg-dark-secondary' : 'bg-white'}`}>
                    <h2 className="text-xl font-semibold mb-4">Add New User</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                          className={`w-full px-3 py-2 border rounded-md ${
                            darkMode 
                              ? 'bg-dark-tertiary border-dark-border text-dark-primary' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Username</label>
                        <input
                          type="text"
                          value={newUser.username}
                          onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                          className={`w-full px-3 py-2 border rounded-md ${
                            darkMode 
                              ? 'bg-dark-tertiary border-dark-border text-dark-primary' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">First Name</label>
                          <input
                            type="text"
                            value={newUser.first_name}
                            onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
                            className={`w-full px-3 py-2 border rounded-md ${
                              darkMode 
                                ? 'bg-dark-tertiary border-dark-border text-dark-primary' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Last Name</label>
                          <input
                            type="text"
                            value={newUser.last_name}
                            onChange={(e) => setNewUser({...newUser, last_name: e.target.value})}
                            className={`w-full px-3 py-2 border rounded-md ${
                              darkMode 
                                ? 'bg-dark-tertiary border-dark-border text-dark-primary' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                          className={`w-full px-3 py-2 border rounded-md ${
                            darkMode 
                              ? 'bg-dark-tertiary border-dark-border text-dark-primary' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Role</label>
                        <select
                          value={newUser.role}
                          onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                          className={`w-full px-3 py-2 border rounded-md ${
                            darkMode 
                              ? 'bg-dark-tertiary border-dark-border text-dark-primary' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="guest">Guest</option>
                          <option value="team_member">Team Member</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="is_active"
                          checked={newUser.is_active}
                          onChange={(e) => setNewUser({...newUser, is_active: e.target.checked})}
                          className="h-4 w-4"
                        />
                        <label htmlFor="is_active" className="ml-2 block text-sm">Active</label>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        onClick={() => setShowAddUserModal(false)}
                        className={`px-4 py-2 rounded-md ${
                          darkMode 
                            ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        }`}
                      >
                        Cancel
                      </button>
                      
                      <button
                        onClick={handleAddUser}
                        className={`px-4 py-2 rounded-md text-white ${
                          darkMode 
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                      >
                        Add User
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div>
              <div className={`overflow-x-auto rounded-lg border ${darkMode ? 'border-dark-border' : 'border-gray-200'}`}>
                <table className={`min-w-full divide-y ${darkMode ? 'divide-dark-border' : 'divide-gray-200'}`}>
                  <thead className={darkMode ? 'bg-dark-tertiary' : 'bg-gray-50'}>
                    <tr>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Key</th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Value</th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Description</th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Last Updated</th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`${darkMode ? 'divide-y divide-dark-border' : 'divide-y divide-gray-200'}`}>
                    {settings.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center">No settings found</td>
                      </tr>
                    ) : (
                      settings.map(setting => (
                        <tr key={setting.id} className={darkMode ? 'bg-dark-secondary' : 'bg-white'}>
                          <td className="px-6 py-4 whitespace-nowrap font-medium">{setting.key}</td>
                          <td className="px-6 py-4">
                            {editingSettings[setting.key] !== undefined ? (
                              <textarea
                                value={editingSettings[setting.key]}
                                onChange={(e) => handleEditSetting(setting.key, e.target.value)}
                                className={`w-full px-2 py-1 border rounded ${
                                  darkMode 
                                    ? 'bg-dark-tertiary border-dark-border text-dark-primary' 
                                    : 'bg-white border-gray-300 text-gray-900'
                                }`}
                                rows={setting.key === 'allowed_email_domains' ? 3 : 1}
                              />
                            ) : (
                              <div className="text-sm whitespace-pre-wrap">{setting.value}</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500 whitespace-pre-wrap">{setting.description}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {new Date(setting.updated_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {editingSettings[setting.key] !== undefined ? (
                              <div className="flex space-x-2">
                                <button 
                                  onClick={() => handleSaveSetting(setting.key, setting.description)}
                                  className={`p-1 rounded ${
                                    darkMode 
                                      ? 'bg-green-800 text-green-200 hover:bg-green-700' 
                                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                                  }`}
                                  title="Save"
                                >
                                  <Save className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => {
                                    setEditingSettings(prev => {
                                      const newSettings = {...prev};
                                      delete newSettings[setting.key];
                                      return newSettings;
                                    });
                                  }}
                                  className={`p-1 rounded ${
                                    darkMode 
                                      ? 'bg-red-900 text-red-200 hover:bg-red-800' 
                                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                                  }`}
                                  title="Cancel"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => handleEditSetting(setting.key, setting.value)}
                                className={`p-1 rounded ${
                                  darkMode 
                                    ? 'bg-blue-800 text-blue-200 hover:bg-blue-700' 
                                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                }`}
                                title="Edit setting"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Audit Logs Tab */}
          {activeTab === 'audit' && (
            <div>
              <div className={`overflow-x-auto rounded-lg border ${darkMode ? 'border-dark-border' : 'border-gray-200'}`}>
                <table className={`min-w-full divide-y ${darkMode ? 'divide-dark-border' : 'divide-gray-200'}`}>
                  <thead className={darkMode ? 'bg-dark-tertiary' : 'bg-gray-50'}>
                    <tr>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Time</th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>User</th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Action</th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Entity</th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Details</th>
                    </tr>
                  </thead>
                  <tbody className={`${darkMode ? 'divide-y divide-dark-border' : 'divide-y divide-gray-200'}`}>
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center">No audit logs found</td>
                      </tr>
                    ) : (
                      auditLogs.map(log => (
                        <tr key={log.id} className={darkMode ? 'bg-dark-secondary' : 'bg-white'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {log.user ? (
                              <div className="text-sm">
                                <div>{log.user.username || log.user.email}</div>
                                <div className="text-xs text-gray-500">{log.user.email}</div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">System</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              log.action === 'CREATE'
                                ? darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                                : log.action === 'UPDATE'
                                  ? darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                                  : log.action === 'DELETE'
                                    ? darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                                    : darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              {log.entity_type}
                              {log.entity_id && <span className="text-gray-500"> #{log.entity_id}</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500 whitespace-pre-wrap">{log.details}</div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminPage;
