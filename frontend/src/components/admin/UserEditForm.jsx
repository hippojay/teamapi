import React from 'react';
import { Check, X } from 'lucide-react';

const UserEditForm = ({ 
  editingUser, 
  setEditingUser: updateUser, 
  handleSaveUser, 
  handleCancelEditUser,
  darkMode,
  userItem
}) => {
  return (
    <>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <input
            type="text"
            value={editingUser.username || ''}
            onChange={(e) => updateUser({...editingUser, username: e.target.value})}
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
              onChange={(e) => updateUser({...editingUser, first_name: e.target.value})}
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
              onChange={(e) => updateUser({...editingUser, last_name: e.target.value})}
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
          onChange={(e) => updateUser({...editingUser, email: e.target.value})}
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
          onChange={(e) => updateUser({...editingUser, role: e.target.value})}
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
          onChange={(e) => updateUser({
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
  );
};

export default UserEditForm;
