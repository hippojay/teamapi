import React from 'react';

const ErrorAlert = ({ error, darkMode }) => {
  if (!error) return null;
  
  return (
    <div className={`mb-4 p-3 ${darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-700'} rounded-md`}>
      {error}
    </div>
  );
};

export default ErrorAlert;
