import React, { useState, useEffect } from 'react';
import { Users, Database, GitBranch, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api';
import OrganisationalGrid from '../components/OrganisationalGrid';
import { useTheme } from '../context/ThemeContext';

const HomePage = () => {
  const { darkMode } = useTheme();
  const [stats, setStats] = useState({
    areas: 0,
    tribes: 0,
    squads: 0,
    services: 0
  });
  
  const [recentSquads, setRecentSquads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Helper function to get color based on capacity
  const getCapacityColor = (capacity) => {
    if (capacity > 1.0) {
      return "text-red-600"; // Over capacity (red)
    } else if (capacity >= 0.8) {
      return "text-green-600"; // Good capacity (green)
    } else if (capacity >= 0.5) {
      return "text-yellow-600"; // Medium capacity (yellow/amber)
    } else {
      return "text-gray-600"; // Low capacity (default gray)
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stats
        const [areas, tribes, squads, services] = await Promise.all([
          api.getAreas(),
          api.getTribes(),
          api.getSquads(),
          api.getServices()
        ]);
        
        setStats({
          areas: areas.length,
          tribes: tribes.length,
          squads: squads.length,
          services: services.length
        });
        
        // Get 3 random squads for featuring
        const shuffled = [...squads].sort(() => 0.5 - Math.random());
        setRecentSquads(shuffled.slice(0, 3));
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return <div className={`text-center py-10 ${darkMode ? 'text-dark-primary' : ''}`}>Loading...</div>;
  }

  if (error) {
    return <div className={`text-center py-10 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</div>;
  }

  return (
    <div>
      <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-dark-primary' : ''}`}>Team API Portal</h1>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border`}>
          <div className="flex items-center">
            <div className={`${darkMode ? 'bg-dark-blue-highlight' : 'bg-blue-100'} p-3 rounded-full mr-4`}>
              <Users className={`h-6 w-6 ${darkMode ? 'text-dark-blue' : 'text-blue-700'}`} />
            </div>
            <div>
              <div className={`text-2xl font-bold ${darkMode ? 'text-dark-primary' : ''}`}>{stats.areas}</div>
              <div className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'}`}>Areas</div>
            </div>
          </div>
        </div>
        
        <div className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border`}>
          <div className="flex items-center">
            <div className={`${darkMode ? 'bg-dark-green-highlight' : 'bg-green-100'} p-3 rounded-full mr-4`}>
              <Users className={`h-6 w-6 ${darkMode ? 'text-dark-green' : 'text-green-700'}`} />
            </div>
            <div>
              <div className={`text-2xl font-bold ${darkMode ? 'text-dark-primary' : ''}`}>{stats.tribes}</div>
              <div className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'}`}>Tribes</div>
            </div>
          </div>
        </div>
        
        <div className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border`}>
          <div className="flex items-center">
            <div className={`${darkMode ? 'bg-dark-purple-highlight' : 'bg-purple-100'} p-3 rounded-full mr-4`}>
              <Users className={`h-6 w-6 ${darkMode ? 'text-dark-purple' : 'text-purple-700'}`} />
            </div>
            <div>
              <div className={`text-2xl font-bold ${darkMode ? 'text-dark-primary' : ''}`}>{stats.squads}</div>
              <div className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'}`}>Squads</div>
            </div>
          </div>
        </div>
        
        <div className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border`}>
          <div className="flex items-center">
            <div className={`${darkMode ? 'bg-dark-amber-highlight' : 'bg-orange-100'} p-3 rounded-full mr-4`}>
              <Database className={`h-6 w-6 ${darkMode ? 'text-dark-amber' : 'text-orange-700'}`} />
            </div>
            <div>
              <div className={`text-2xl font-bold ${darkMode ? 'text-dark-primary' : ''}`}>{stats.services}</div>
              <div className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'}`}>Services</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Organisational Grid */}
      <div className="mb-10">
        <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-dark-primary' : ''}`}>Organisation Structure</h2>
        <OrganisationalGrid />
      </div>
      
      {/* Featured Squads */}
      <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-dark-primary' : ''}`}>Featured Squads</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {recentSquads.map(squad => (
          <div key={squad.id} className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white'} p-6 rounded-lg shadow-sm border`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>{squad.name}</h3>
              <span className={`px-3 py-1 rounded-full text-sm ${
                squad.status === 'Active' 
                  ? darkMode ? 'bg-green-900 text-green-200 border border-green-700' : 'bg-green-100 text-green-800' 
                  : squad.status === 'Forming'
                    ? darkMode ? 'bg-blue-900 text-blue-200 border border-blue-700' : 'bg-blue-100 text-blue-800'
                    : darkMode ? 'bg-gray-800 text-gray-200 border border-gray-700' : 'bg-gray-100 text-gray-800'
              }`}>
                {squad.status}
              </span>
            </div>
            <div className={`flex items-center space-x-2 ${darkMode ? 'text-dark-secondary' : 'text-gray-600'} mb-4`}>
              <Users className="h-5 w-5" />
              <span>{squad.member_count > 0 ? squad.member_count : 'No'} member{squad.member_count !== 1 ? 's' : ''}</span>
              <span className="mx-2">•</span>
              <span className={`font-medium ${darkMode ? squad.total_capacity > 1.0 ? 'text-red-400' : squad.total_capacity >= 0.8 ? 'text-green-400' : squad.total_capacity >= 0.5 ? 'text-yellow-400' : 'text-gray-400' : getCapacityColor(squad.total_capacity)}`}>
                {squad.total_capacity.toFixed(1)} FTE
              </span>
              <span className="mx-2">•</span>
              <Clock className="h-5 w-5" />
              <span>{squad.timezone}</span>
            </div>
            <p className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'} mb-4 line-clamp-2`}>
              {squad.description}
            </p>
            <Link 
              to={`/squads/${squad.id}`}
              className={`inline-block px-4 py-2 ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-lg`}
            >
              View Squad
            </Link>
          </div>
        ))}
      </div>
      
      {/* Dependency Preview */}
      <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-dark-primary' : ''}`}>Team Dependencies</h2>
      <div className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white'} p-6 rounded-lg shadow-sm border mb-8`}>
        <div className="flex items-center justify-between mb-4">
          <p className={`${darkMode ? 'text-dark-secondary' : 'text-gray-600'}`}>
            Visualise dependencies between squads to understand how teams work together.
          </p>
          <Link 
            to="/dependencies"
            className={`px-4 py-2 ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-lg`}
          >
            View Full Map
          </Link>
        </div>
        <div className={`${darkMode ? 'bg-dark-secondary' : 'bg-gray-50'} h-40 rounded-lg flex items-center justify-center`}>
          <div className="text-center">
            <GitBranch className={`h-10 w-10 mx-auto ${darkMode ? 'text-gray-600' : 'text-gray-400'} mb-2`} />
            <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Interactive dependency visualisation</span>
          </div>
        </div>
      </div>
      
      {/* Quick Links */}
      <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-dark-primary' : ''}`}>Quick Links</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white'} p-6 rounded-lg shadow-sm border`}>
          <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-dark-primary' : ''}`}>Explore Organisation</h3>
          <ul className="space-y-2">
            <li>
              <Link to="/areas" className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:underline'} flex items-center`}>
                <Users className="h-4 w-4 mr-2" />
                View All Areas
              </Link>
            </li>
            <li>
              <Link to="/tribes" className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:underline'} flex items-center`}>
                <Users className="h-4 w-4 mr-2" />
                View All Tribes
              </Link>
            </li>
            <li>
              <Link to="/squads" className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:underline'} flex items-center`}>
                <Users className="h-4 w-4 mr-2" />
                View All Squads
              </Link>
            </li>
          </ul>
        </div>
        
        <div className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white'} p-6 rounded-lg shadow-sm border`}>
          <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-dark-primary' : ''}`}>Technical Resources</h3>
          <ul className="space-y-2">
            <li>
              <Link to="/services" className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:underline'} flex items-center`}>
                <Database className="h-4 w-4 mr-2" />
                View All Services
              </Link>
            </li>
            <li>
              <Link to="/dependencies" className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:underline'} flex items-center`}>
                <GitBranch className="h-4 w-4 mr-2" />
                View Dependencies Map
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
