import React from 'react';
import { Upload } from 'lucide-react';

const FileUploadInterface = ({ uploadFile, setUploadFile, fileError, isLoadingSheets, handleFileChange, darkMode }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">Upload File</label>
      <div className={`border-2 border-dashed rounded-lg p-6 text-center ${darkMode ? 'border-dark-border hover:bg-dark-tertiary' : 'border-gray-300 hover:bg-gray-50'}`}>
        <input
          id="file-upload"
          type="file"
          accept=".xlsx,.xlsb,.xlsm,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
        />
        {uploadFile ? (
          <div>
            <p className="mb-2">Selected file: <span className="font-semibold">{uploadFile.name}</span></p>
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => {
                  setUploadFile(null);
                  document.getElementById('file-upload').value = '';
                }}
                className={`px-3 py-1 rounded text-sm ${darkMode ? 'bg-red-900 text-red-200 hover:bg-red-800' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
              >
                Remove
              </button>
              <label
                htmlFor="file-upload"
                className={`px-3 py-1 rounded text-sm cursor-pointer ${darkMode ? 'bg-blue-800 text-blue-200 hover:bg-blue-700' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}
              >
                Change File
              </label>
            </div>
          </div>
        ) : (
          <div>
            <Upload className="mx-auto h-12 w-12 mb-2 text-gray-400" />
            <p className="mb-2">Drag and drop your Excel file here, or</p>
            <label
              htmlFor="file-upload"
              className={`inline-block px-4 py-2 rounded cursor-pointer ${darkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            >
              Browse for file
            </label>
            <p className="mt-2 text-sm text-gray-500">
              Supported formats: .xlsx, .xlsb, .xlsm, .xls, .csv
            </p>
          </div>
        )}
      </div>
      {fileError && <p className="text-red-500 mt-2 text-sm">{fileError}</p>}
      {isLoadingSheets && <p className="text-blue-500 mt-2 text-sm">Loading sheet names...</p>}
    </div>
  );
};

export default FileUploadInterface;
