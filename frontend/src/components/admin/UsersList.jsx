import React from 'react';
import { Search, Edit } from 'lucide-react';
import { formatRole, getRoleBadgeClasses } from '../../utils/roleUtils';
import UserEditForm from './UserEditForm';

const UsersList = ({
  users,
  searchText,
  setSearchText,
  editingUser,
  setEditingUser,
  handleEditUser,
  handleCancelEditUser,
  handleSaveUser,
  setShowAddUserModal,
  darkMode
}) => {
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchText.toLowerCase()) ||
    (user.username && user.username.toLowerCase().includes(searchText.toLowerCase())) ||
    (user.first_name && user.first_name.toLowerCase().includes(searchText.toLowerCase())) ||
    (user.last_name && user.last_name.toLowerCase().includes(searchText.toLowerCase()))
  );

  return (
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
          <span className="h-4 w-4 mr-1">+</span>
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
                    <UserEditForm 
                      editingUser={editingUser}
                      setEditingUser={updatedUser => setEditingUser(updatedUser)}
                      handleSaveUser={handleSaveUser}
                      handleCancelEditUser={handleCancelEditUser}
                      darkMode={darkMode}
                      userItem={userItem}
                    />
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
    </div>
  );
};

export default UsersList;
