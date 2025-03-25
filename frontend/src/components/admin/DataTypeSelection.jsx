import React from 'react';

const DataTypeSelection = ({ dataType, setDataType, setFileError, setUploadFile, darkMode }) => {
  const handleDataTypeChange = (newType) => {
    setDataType(newType);
    
    // For dependencies, check if there's a file already selected and validate it's CSV
    if (newType === 'dependencies') {
      const fileInput = document.getElementById('file-upload');
      if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        if (!file.name.toLowerCase().endsWith('.csv')) {
          setFileError('Dependencies data must be uploaded in CSV format');
          setUploadFile(null);
          fileInput.value = '';
        }
      }
    }
  };
  
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">Data Type</label>
      <div className="flex flex-wrap gap-4">
        <label className="inline-flex items-center">
          <input
            type="radio"
            name="dataType"
            value="organization"
            checked={dataType === 'organization'}
            onChange={() => handleDataTypeChange('organization')}
            className="mr-2"
          />
          <span>Organisation Structure</span>
        </label>
        <label className="inline-flex items-center">
          <input
            type="radio"
            name="dataType"
            value="services"
            checked={dataType === 'services'}
            onChange={() => handleDataTypeChange('services')}
            className="mr-2"
          />
          <span>Services</span>
        </label>
        <label className="inline-flex items-center">
          <input
            type="radio"
            name="dataType"
            value="dependencies"
            checked={dataType === 'dependencies'}
            onChange={() => handleDataTypeChange('dependencies')}
            className="mr-2"
          />
          <span>Dependencies</span>
        </label>
      </div>
      
      {dataType === 'organization' && (
        <div className="mt-2 text-sm text-gray-500">
          Upload organization structure data (areas, tribes, squads, team members).
          <a
            href="http://localhost:8000/organization_template.csv"
            download
            className="ml-1 text-blue-500 hover:text-blue-700 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download template
          </a>
        </div>
      )}
      {dataType === 'services' && (
        <div className="mt-2 text-sm text-gray-500">
          Upload services data for squads.
          <a
            href="http://localhost:8000/services_template.csv"
            download
            className="ml-1 text-blue-500 hover:text-blue-700 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download template
          </a>
        </div>
      )}
      {dataType === 'dependencies' && (
        <div className="mt-2 text-sm text-gray-500">
          Note: Dependencies must be uploaded as a CSV file following the template format.
          <a
            href="http://localhost:8000/dependencies_template.csv"
            download
            className="ml-1 text-blue-500 hover:text-blue-700 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download template
          </a>
        </div>
      )}
    </div>
  );
};

export default DataTypeSelection;
