import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/**
 * A reusable breadcrumb component that works across all pages
 * @param {Object} props
 * @param {Array} props.items - Array of breadcrumb items each with {path, label, isLast}
 * @param {Boolean} props.showHomeLink - Whether to show Home as first link (default: true)
 */
const Breadcrumbs = ({ items = [], showHomeLink = true }) => {
  const { darkMode } = useTheme();
  const location = useLocation();

  // If no items provided, auto-generate from path
  if (items.length === 0) {
    const paths = location.pathname.split('/').filter(Boolean);
    items = paths.map((path, index) => ({
      label: path.charAt(0).toUpperCase() + path.slice(1),
      path: `/${paths.slice(0, index + 1).join('/')}`,
      isLast: index === paths.length - 1
    }));
  }

  return (
    <div className={`flex items-center text-sm ${darkMode ? 'text-dark-secondary' : 'text-gray-600'} mb-6 flex-wrap`}>
      {showHomeLink && (
        <>
          <Link to="/" className={`${darkMode ? 'hover:text-blue-400' : 'hover:text-blue-500'}`}>
            Home
          </Link>
          {items.length > 0 && <ChevronRight className="h-4 w-4 mx-2" />}
        </>
      )}

      {items.map((item, index) => (
        <React.Fragment key={item.path || index}>
          {item.isLast ? (
            <span className={`font-medium ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>
              {item.label}
            </span>
          ) : (
            <>
              <Link 
                to={item.path} 
                className={`${darkMode ? 'hover:text-blue-400' : 'hover:text-blue-500'}`}
              >
                {item.label}
              </Link>
              <ChevronRight className="h-4 w-4 mx-2" />
            </>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Breadcrumbs;
