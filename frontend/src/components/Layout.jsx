import React from 'react';
import { Users, Home as HomeIcon, Grid, Database, Layers, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import SearchBar from './SearchBar';

const Layout = ({ children }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Function to check if a route is active
  const isActive = (path) => {
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(path);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r shadow-sm flex flex-col">
        {/* Logo/App Name */}
        <div className="p-6 border-b">
          <Link to="/" className="text-xl font-bold text-gray-800 no-underline flex items-center">
            <Grid className="h-6 w-6 mr-2 text-blue-600" />
            Who What Where
          </Link>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 pt-6">
          <ul className="space-y-1">
            <li>
              <Link 
                to="/" 
                className={`flex items-center px-6 py-3 text-gray-600 hover:bg-gray-100 hover:text-blue-600 ${
                  isActive('/') ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''
                }`}
              >
                <HomeIcon className="h-5 w-5 mr-3" />
                <span className="font-medium">Home</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/areas" 
                className={`flex items-center px-6 py-3 text-gray-600 hover:bg-gray-100 hover:text-blue-600 ${
                  isActive('/areas') ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''
                }`}
              >
                <Grid className="h-5 w-5 mr-3" />
                <span className="font-medium">Areas</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/tribes" 
                className={`flex items-center px-6 py-3 text-gray-600 hover:bg-gray-100 hover:text-blue-600 ${
                  isActive('/tribes') ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''
                }`}
              >
                <Layers className="h-5 w-5 mr-3" />
                <span className="font-medium">Tribes</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/squads" 
                className={`flex items-center px-6 py-3 text-gray-600 hover:bg-gray-100 hover:text-blue-600 ${
                  isActive('/squads') ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''
                }`}
              >
                <Users className="h-5 w-5 mr-3" />
                <span className="font-medium">Squads</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/services" 
                className={`flex items-center px-6 py-3 text-gray-600 hover:bg-gray-100 hover:text-blue-600 ${
                  isActive('/services') ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''
                }`}
              >
                <Database className="h-5 w-5 mr-3" />
                <span className="font-medium">Services</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/users" 
                className={`flex items-center px-6 py-3 text-gray-600 hover:bg-gray-100 hover:text-blue-600 ${
                  isActive('/users') ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''
                }`}
              >
                <User className="h-5 w-5 mr-3" />
                <span className="font-medium">Team Members</span>
              </Link>
            </li>
          </ul>
        </nav>
        
        {/* Footer - Optional */}
        <div className="p-4 border-t text-xs text-gray-500">
          <p>Who What Where - v1.0</p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b shadow-sm p-4 flex justify-between items-center">
          <div className="w-1/3">
            <h1 className="text-xl font-bold text-gray-800">
              {/* Dynamic Page Title */}
              {currentPath === '/' ? 'Home' : 
               currentPath.startsWith('/areas') ? 'Areas' :
               currentPath.startsWith('/tribes') ? 'Tribes' :
               currentPath.startsWith('/squads') ? 'Squads' :
               currentPath.startsWith('/services') ? 'Services' :
               currentPath.startsWith('/users') ? 'Team Members' : 'Who What Where'}
            </h1>
          </div>
          
          <div className="w-1/3 flex justify-center">
            <SearchBar />
          </div>
          
          <div className="w-1/3">
            {/* Empty div to maintain spacing */}
          </div>
        </header>
        
        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="bg-white border-t p-4 text-center text-gray-600">
          <p>&copy; 2025 Who What Where - Team API Portal</p>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
