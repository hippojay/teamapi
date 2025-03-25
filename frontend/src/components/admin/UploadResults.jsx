import React from 'react';

const UploadResults = ({ uploadResult, isDryRun, darkMode }) => {
  return (
    <div className={`mt-4 p-4 border rounded-lg ${darkMode ? 'bg-dark-secondary border-dark-border' : 'bg-white border-gray-200'}`}>
      <h4 className="text-lg font-semibold mb-2">Upload {isDryRun ? 'Test ' : ''}Results</h4>
      <div className={`p-3 rounded-md ${darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'}`}>
        <p>{uploadResult.summary.message || 'Data processed successfully.'}</p>
        {isDryRun && (
          <p className="mt-2 font-medium">This was a dry run. No changes were made to the database.</p>
        )}
      </div>
    </div>
  );
};

export default UploadResults;
