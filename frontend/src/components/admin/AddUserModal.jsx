import React from 'react';

const AddUserModal = ({ showAddUserModal, setShowAddUserModal, newUser, setNewUser, handleAddUser, darkMode }) => {
  if (!showAddUserModal) return null;
  
  return (
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
  );
};

export default AddUserModal;
