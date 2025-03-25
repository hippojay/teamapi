import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { isAdmin } from '../utils/roleUtils';
import api from '../api';

// Import components
import TabNavigation from '../components/admin/TabNavigation';
import UsersList from '../components/admin/UsersList';
import AddUserModal from '../components/admin/AddUserModal';
import SettingsList from '../components/admin/SettingsList';
import AddSettingModal from '../components/admin/AddSettingModal';
import AuditLogsList from '../components/admin/AuditLogsList';
import DataUpload from '../components/admin/DataUpload';
import ErrorAlert from '../components/admin/ErrorAlert';
import LoadingIndicator from '../components/admin/LoadingIndicator';

const AdminPage = () => {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('users');
  
  // Common states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // User management states
  const [users, setUsers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [editingUser, setEditingUser] = useState(null);
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
  
  // Settings states
  const [settings, setSettings] = useState([]);
  const [editingSettings, setEditingSettings] = useState({});
  const [showAddSettingModal, setShowAddSettingModal] = useState(false);
  const [newSetting, setNewSetting] = useState({
    key: '',
    value: '',
    description: ''
  });
  
  // Audit log states
  const [auditLogs, setAuditLogs] = useState([]);
  
  // Data upload states
  const [uploadFile, setUploadFile] = useState(null);
  const [dataType, setDataType] = useState('organization');
  const [isDryRun, setIsDryRun] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [fileError, setFileError] = useState('');
  const [worksheets, setWorksheets] = useState([]);
  const [selectedWorksheet, setSelectedWorksheet] = useState('');

  // Load data based on active tab
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
      }
      // No data to load for upload tab
    } catch (error) {
      setError('Failed to load data. Please try again.');
      console.error('Error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);
  
  // Check if user is admin on mount and when user changes
  useEffect(() => {
    if (user && !isAdmin(user)) {
      navigate('/');
      return;
    }
    
    loadData();
  }, [user, navigate, activeTab, loadData]);

  // User management handlers
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
  
  // Settings handlers
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
  
  // Data upload handlers
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file extension
      const validExtensions = ['.xlsx', '.xlsb', '.xlsm', '.xls', '.csv'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      const isCSV = fileExtension === '.csv';
      
      // For dependencies, only allow CSV format
      if (dataType === 'dependencies' && !isCSV) {
        setFileError('Dependencies data must be uploaded in CSV format');
        setUploadFile(null);
        setWorksheets([]);
        setSelectedWorksheet('');
        return;
      }
      
      if (validExtensions.includes(fileExtension)) {
        setUploadFile(file);
        setFileError('');
        setUploadResult(null);
        
        // Reset worksheets and selected worksheet
        setWorksheets([]);
        setSelectedWorksheet('');
        
        // For CSV files or dependencies, we don't need to get worksheets
        if (fileExtension === '.csv' || dataType === 'dependencies') {
          // For CSV files, use a special 'data' sheet name
          setWorksheets(['data']);
          setSelectedWorksheet('data');
        } else {
          // Get sheet names from the file for Excel files
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
        }
      } else {
        setFileError('Invalid file format. Please upload an Excel file (.xlsx, .xlsb, .xlsm, .xls) or CSV file (.csv)');
        setUploadFile(null);
        setWorksheets([]);
        setSelectedWorksheet('');
      }
    }
  };
  
  const handleFileUpload = async () => {
    if (!uploadFile) {
      setFileError('Please select a file to upload');
      return;
    }
    
    // For Excel files, we need a selected worksheet (except for CSV files or dependencies data type)
    const isCSV = uploadFile.name.toLowerCase().endsWith('.csv');
    if (!isCSV && dataType !== 'dependencies' && !selectedWorksheet) {
      setFileError('Please select a worksheet from the Excel file');
      return;
    }
    
    setIsUploading(true);
    setError('');
    setUploadResult(null);
    
    try {
      // For dependencies or CSV files, we don't need to specify a worksheet
      const worksheetToUse = isCSV || dataType === 'dependencies' ? null : selectedWorksheet;
      const result = await api.uploadData(uploadFile, dataType, worksheetToUse, isDryRun);
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

  return (
    <div className={`container mx-auto mt-16 p-6 ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <TabNavigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        darkMode={darkMode} 
      />
      
      <ErrorAlert error={error} darkMode={darkMode} />
      
      {isLoading ? (
        <LoadingIndicator />
      ) : (
        <>
          {/* Users Tab */}
          {activeTab === 'users' && (
            <UsersList 
              users={users}
              searchText={searchText}
              setSearchText={setSearchText}
              editingUser={editingUser}
              setEditingUser={setEditingUser}
              handleEditUser={handleEditUser}
              handleCancelEditUser={handleCancelEditUser}
              handleSaveUser={handleSaveUser}
              setShowAddUserModal={setShowAddUserModal}
              darkMode={darkMode}
            />
          )}
          
          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <SettingsList 
              settings={settings}
              editingSettings={editingSettings}
              handleEditSetting={handleEditSetting}
              handleSaveSetting={handleSaveSetting}
              setShowAddSettingModal={setShowAddSettingModal}
              darkMode={darkMode}
            />
          )}
          
          {/* Audit Logs Tab */}
          {activeTab === 'audit' && (
            <AuditLogsList 
              auditLogs={auditLogs}
              darkMode={darkMode}
            />
          )}
          
          {/* Data Upload Tab */}
          {activeTab === 'upload' && (
            <DataUpload 
              uploadFile={uploadFile}
              setUploadFile={setUploadFile}
              dataType={dataType}
              setDataType={setDataType}
              isDryRun={isDryRun}
              setIsDryRun={setIsDryRun}
              isUploading={isUploading}
              setIsUploading={setIsUploading}
              isLoadingSheets={isLoadingSheets}
              setIsLoadingSheets={setIsLoadingSheets}
              uploadResult={uploadResult}
              setUploadResult={setUploadResult}
              fileError={fileError}
              setFileError={setFileError}
              worksheets={worksheets}
              setWorksheets={setWorksheets}
              selectedWorksheet={selectedWorksheet}
              setSelectedWorksheet={setSelectedWorksheet}
              handleFileChange={handleFileChange}
              handleFileUpload={handleFileUpload}
              darkMode={darkMode}
            />
          )}
        </>
      )}
      
      {/* Modals */}
      <AddUserModal 
        showAddUserModal={showAddUserModal}
        setShowAddUserModal={setShowAddUserModal}
        newUser={newUser}
        setNewUser={setNewUser}
        handleAddUser={handleAddUser}
        darkMode={darkMode}
      />
      
      <AddSettingModal 
        showAddSettingModal={showAddSettingModal}
        setShowAddSettingModal={setShowAddSettingModal}
        newSetting={newSetting}
        setNewSetting={setNewSetting}
        handleAddSetting={handleAddSetting}
        darkMode={darkMode}
      />
    </div>
  );
};

export default AdminPage;
