import React from 'react';
import { User, Settings, History, Database } from 'lucide-react';

const TabNavigation = ({ activeTab, setActiveTab, darkMode }) => {
  const tabs = [
    { id: 'users', label: 'Users', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'audit', label: 'Audit Logs', icon: History },
    { id: 'upload', label: 'Upload Data', icon: Database },
  ];

  return (
    <div className="flex mb-6 border-b">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`py-2 px-4 text-center ${
            activeTab === tab.id
              ? `border-b-2 ${darkMode ? 'border-blue-400 text-blue-400' : 'border-blue-600 text-blue-600'}`
              : `${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'}`
          }`}
          onClick={() => setActiveTab(tab.id)}
        >
          <tab.icon className="h-4 w-4 mr-1 inline-block" />
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;
