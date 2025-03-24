import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Check, X, Edit, Search, User, Settings, History, Plus, Save, Upload, Database } from 'lucide-react';
import { isAdmin, formatRole, getRoleBadgeClasses } from '../utils/roleUtils';
import api from '../api';

const AdminPage = () => {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('users');
  // State for file upload
  const [uploadFile, setUploadFile] = useState(null);
  const [dataType, setDataType] = useState('organization');
  const [isDryRun, setIsDryRun] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [fileError, setFileError] = useState('');
  const [worksheets, setWorksheets] = useState([]);
  const [selectedWorksheet, setSelectedWorksheet] = useState('');
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
  const [newSetting, setNewSetting] = useState({
    key: '',
    value: '',
    description: ''
  });
  const [showAddSettingModal, setShowAddSettingModal] = useState(false);

  const loadData = useCallback(async () => {
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
      } else if (activeTab === 'upload') {
        // No data to load for upload tab
      }
    } catch (error) {
      setError('Failed to load data. Please try again.');
      console.error('Error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);
  
  // Handle file selection
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file extension
      const validExtensions = ['.xlsx', '.xlsb', '.xlsm', '.xls'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (validExtensions.includes(fileExtension)) {
        setUploadFile(file);
        setFileError('');
        setUploadResult(null);
        
        // Reset worksheets and selected worksheet
        setWorksheets([]);
        setSelectedWorksheet('');
        
        // Get sheet names from the file
        setIsLoadingSheets(true);
        try {
          const result = await api.getExcelSheets(file);
          if (result.sheets && result.sheets.length > 0) {
            setWorksheets(result.sheets);
            // Default to first sheet if only one, or default sheet based on data type
            if (result.sheets.length === 1) {
              setSelectedWorksheet(result.sheets[0]);
            } else {
              // Try to find default sheets based on data type
              if (dataType === 'services' && result.sheets.includes('Services')) {
                setSelectedWorksheet('Services');
              } else if (result.sheets.includes('Sheet1')) {
                setSelectedWorksheet('Sheet1');
              } else {
                setSelectedWorksheet(result.sheets[0]);
              }
            }
          }
        } catch (error) {
          console.error('Error getting sheet names:', error);
          setFileError('Error reading Excel file: ' + (error.message || 'Unknown error'));
          setUploadFile(null);
        } finally {
          setIsLoadingSheets(false);
        }
      } else {
        setFileError('Invalid file format. Please upload an Excel file (.xlsx, .xlsb, .xlsm, .xls)');
        setUploadFile(null);
        setWorksheets([]);
        setSelectedWorksheet('');
      }
    }
  };
  
  // Handle file upload
  const handleFileUpload = async () => {
    if (!uploadFile) {
      setFileError('Please select a file to upload');
      return;
    }
    
    if (!selectedWorksheet) {
      setFileError('Please select a worksheet from the Excel file');
      return;
    }
    
    setIsUploading(true);
    setError('');
    setUploadResult(null);
    
    try {
      const result = await api.uploadData(uploadFile, dataType, selectedWorksheet, isDryRun);
      setUploadResult(result);
      // Reset file input
      document.getElementById('file-upload').value = '';
      setUploadFile(null);
      setWorksheets([]);
      setSelectedWorksheet('');
    } catch (error) {
      setError(error.message || 'Failed to upload data');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    // Check if user is admin
    if (user && !isAdmin(user)) {
      navigate('/');
      return;
    }
    
    loadData();
  }, [user, navigate, activeTab, loadData]);

  // loadData function moved above useEffect to fix 'no-use-before-define' error
  
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
  
  const handleAddSetting = async () => {
    try {
      await api.updateAdminSetting(newSetting.key, {
        value: newSetting.value,
        description: newSetting.description
      });
      setShowAddSettingModal(false);
      setNewSetting({
        key: '',
        value: '',
        description: ''
      });
      loadData();
    } catch (error) {
      setError('Failed to create setting. Please try again.');
      console.error('Error creating setting:', error);
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
        
        <button
          className={`py-2 px-4 text-center ${
            activeTab === 'upload'
              ? `border-b-2 ${darkMode ? 'border-blue-400 text-blue-400' : 'border-blue-600 text-blue-600'}`
              : `${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'}`
          }`}
          onClick={() => setActiveTab('upload')}
        >
          <Database className="h-4 w-4 mr-1 inline-block" />
          Upload Data
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
              <div className="flex justify-between items-center mb-4">
                <div className="flex-1">
                  <h3 className={`text-xl font-semibold ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>System Settings</h3>
                </div>
                <button
                  onClick={() => setShowAddSettingModal(true)}
                  className={`flex items-center px-3 py-2 rounded-md text-white ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Setting
                </button>
              </div>
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
                                  <div>
                                    <textarea
                                      value={editingSettings[setting.key]}
                                      onChange={(e) => handleEditSetting(setting.key, e.target.value)}
                                      className={`w-full px-2 py-1 border rounded ${
                                        darkMode 
                                          ? 'bg-dark-tertiary border-dark-border text-dark-primary' 
                                          : 'bg-white border-gray-300 text-gray-900'
                                      }`}
                                      rows={setting.key === 'allowed_email_domains' ? 5 : 2}
                                      placeholder={setting.key === 'allowed_email_domains' ? "example.com\ngmail.com\ndomain.org" : ""}
                                    />
                                    {setting.key === 'allowed_email_domains' && (
                                      <div className="text-xs mt-1 text-gray-500">
                                        Enter one domain per line or separate with commas.<br />
                                        Users will only be able to register with email addresses from these domains.
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div>
                                    <div className="text-sm whitespace-pre-wrap">{setting.value}</div>
                                    {setting.key === 'allowed_email_domains' && (
                                      <div className="text-xs mt-1 text-gray-500">
                                        Only users with email addresses from these domains can register.
                                      </div>
                                    )}
                                  </div>
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

              {/* Add Setting Modal */}
              {showAddSettingModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className={`rounded-lg shadow-xl w-full max-w-md p-6 ${darkMode ? 'bg-dark-secondary' : 'bg-white'}`}>
                    <h2 className="text-xl font-semibold mb-4">Add New Setting</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Key</label>
                        <input
                          type="text"
                          value={newSetting.key}
                          onChange={(e) => setNewSetting({...newSetting, key: e.target.value})}
                          className={`w-full px-3 py-2 border rounded-md ${darkMode ? 'bg-dark-tertiary border-dark-border text-dark-primary' : 'bg-white border-gray-300 text-gray-900'}`}
                          placeholder="allowed_email_domains"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Value</label>
                        <textarea
                          value={newSetting.value}
                          onChange={(e) => setNewSetting({...newSetting, value: e.target.value})}
                          className={`w-full px-3 py-2 border rounded-md ${darkMode ? 'bg-dark-tertiary border-dark-border text-dark-primary' : 'bg-white border-gray-300 text-gray-900'}`}
                          rows="4"
                          placeholder="example.com\ngmail.com\ndomain.org"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                          value={newSetting.description}
                          onChange={(e) => setNewSetting({...newSetting, description: e.target.value})}
                          className={`w-full px-3 py-2 border rounded-md ${darkMode ? 'bg-dark-tertiary border-dark-border text-dark-primary' : 'bg-white border-gray-300 text-gray-900'}`}
                          rows="2"
                          placeholder="Description of this setting..."
                        />
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        onClick={() => setShowAddSettingModal(false)}
                        className={`px-4 py-2 rounded-md ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                      >
                        Cancel
                      </button>
                      
                      <button
                        onClick={handleAddSetting}
                        className={`px-4 py-2 rounded-md text-white ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}
                      >
                        Add Setting
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
          
          {/* Data Upload Tab */}
          {activeTab === 'upload' && (
            <div>
              <div className="mb-8">
                <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>
                  Upload Organisation Data
                </h3>
                <div className={`p-6 rounded-lg ${darkMode ? 'bg-dark-secondary border border-dark-border' : 'bg-white border border-gray-200 shadow-sm'}`}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Data Type</label>
                    <div className="flex space-x-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="dataType"
                          value="organization"
                          checked={dataType === 'organization'}
                          onChange={() => setDataType('organization')}
                          className="mr-2"
                        />
                        <span>Organisation Structure</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="dataType"
                          value="services"
                          checked={dataType === 'services'}
                          onChange={() => setDataType('services')}
                          className="mr-2"
                        />
                        <span>Services</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Upload File</label>
                    <div className={`border-2 border-dashed rounded-lg p-6 text-center ${darkMode ? 'border-dark-border hover:bg-dark-tertiary' : 'border-gray-300 hover:bg-gray-50'}`}>
                      <input
                        id="file-upload"
                        type="file"
                        accept=".xlsx,.xlsb,.xlsm,.xls"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      {uploadFile ? (
                        <div>
                          <p className="mb-2">Selected file: <span className="font-semibold">{uploadFile.name}</span></p>
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => {
                                setUploadFile(null);
                                document.getElementById('file-upload').value = '';
                                setWorksheets([]);
                                setSelectedWorksheet('');
                              }}
                              className={`px-3 py-1 rounded text-sm ${darkMode ? 'bg-red-900 text-red-200 hover:bg-red-800' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
                            >
                              Remove
                            </button>
                            <label
                              htmlFor="file-upload"
                              className={`px-3 py-1 rounded text-sm cursor-pointer ${darkMode ? 'bg-blue-800 text-blue-200 hover:bg-blue-700' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}
                            >
                              Change File
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <Upload className="mx-auto h-12 w-12 mb-2 text-gray-400" />
                          <p className="mb-2">Drag and drop your Excel file here, or</p>
                          <label
                            htmlFor="file-upload"
                            className={`inline-block px-4 py-2 rounded cursor-pointer ${darkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                          >
                            Browse for file
                          </label>
                          <p className="mt-2 text-sm text-gray-500">
                            Supported formats: .xlsx, .xlsb, .xlsm, .xls
                          </p>
                        </div>
                      )}
                    </div>
                    {fileError && <p className="text-red-500 mt-2 text-sm">{fileError}</p>}
                    {isLoadingSheets && <p className="text-blue-500 mt-2 text-sm">Loading sheet names...</p>}
                  </div>
                  
                  {/* Worksheet selection dropdown */}
                  {worksheets.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Select Worksheet</label>
                      <select
                        value={selectedWorksheet}
                        onChange={(e) => setSelectedWorksheet(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md ${darkMode ? 'bg-dark-tertiary border-dark-border text-dark-primary' : 'bg-white border-gray-300 text-gray-900'}`}
                      >
                        {worksheets.map((sheet) => (
                          <option key={sheet} value={sheet}>{sheet}</option>
                        ))}
                      </select>
                      {worksheets.length === 1 && (
                        <p className="text-gray-500 mt-1 text-sm">Only one worksheet found in this file.</p>
                      )}
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isDryRun}
                        onChange={() => setIsDryRun(!isDryRun)}
                        className="mr-2"
                      />
                      <span>Dry Run (Preview changes without applying them)</span>
                    </label>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={handleFileUpload}
                      disabled={!uploadFile || isUploading}
                      className={`flex items-center px-4 py-2 rounded ${!uploadFile || isUploading ? 
                        (darkMode ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed') : 
                        (darkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600')}`}
                    >
                      {isUploading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-1" />
                          {isDryRun ? 'Test Upload' : 'Upload'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Upload Results */}
              {uploadResult && (
                <div className={`mt-4 p-4 border rounded-lg ${darkMode ? 'bg-dark-secondary border-dark-border' : 'bg-white border-gray-200'}`}>
                  <h4 className="text-lg font-semibold mb-2">Upload {isDryRun ? 'Test ' : ''}Results</h4>
                  <div className={`p-3 rounded-md ${darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'}`}>
                    <p>{uploadResult.summary.message || 'Data processed successfully.'}</p>
                    {isDryRun && (
                      <p className="mt-2 font-medium">This was a dry run. No changes were made to the database.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminPage;
