import React from 'react';

const WorksheetSelection = ({ 
  worksheets, 
  selectedWorksheet, 
  setSelectedWorksheet, 
  dataType, 
  uploadFile, 
  darkMode 
}) => {
  // Only show for Excel files and not dependencies
  if (
    worksheets.length === 0 || 
    dataType === 'dependencies' || 
    (uploadFile && uploadFile.name.toLowerCase().endsWith('.csv'))
  ) {
    return null;
  }

  return (
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
  );
};

export default WorksheetSelection;
