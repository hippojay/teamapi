import React from 'react';
import { Upload } from 'lucide-react';
import DataTypeSelection from './DataTypeSelection';
import FileUploadInterface from './FileUploadInterface';
import WorksheetSelection from './WorksheetSelection';
import UploadResults from './UploadResults';

const DataUpload = ({
  uploadFile,
  setUploadFile,
  dataType,
  setDataType,
  isDryRun,
  setIsDryRun,
  isUploading,
  setIsUploading,
  isLoadingSheets,
  setIsLoadingSheets,
  uploadResult,
  setUploadResult,
  fileError,
  setFileError,
  worksheets,
  setWorksheets,
  selectedWorksheet,
  setSelectedWorksheet,
  handleFileChange,
  handleFileUpload,
  darkMode
}) => {
  return (
    <div>
      <div className="mb-8">
        <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-dark-primary' : 'text-gray-800'}`}>
          Upload Organisation Data
        </h3>
        <div className={`p-6 rounded-lg ${darkMode ? 'bg-dark-secondary border border-dark-border' : 'bg-white border border-gray-200 shadow-sm'}`}>
          <DataTypeSelection 
            dataType={dataType}
            setDataType={setDataType}
            setFileError={setFileError}
            setUploadFile={setUploadFile}
            darkMode={darkMode}
          />
          
          <FileUploadInterface 
            uploadFile={uploadFile}
            setUploadFile={setUploadFile}
            fileError={fileError}
            isLoadingSheets={isLoadingSheets}
            handleFileChange={handleFileChange}
            darkMode={darkMode}
          />
          
          <WorksheetSelection 
            worksheets={worksheets}
            selectedWorksheet={selectedWorksheet}
            setSelectedWorksheet={setSelectedWorksheet}
            dataType={dataType}
            uploadFile={uploadFile}
            darkMode={darkMode}
          />
          
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isDryRun}
                onChange={() => setIsDryRun(!isDryRun)}
                className="mr-2"
              />
              <span>Dry Run (Preview changes without applying them)</span>
            </label>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleFileUpload}
              disabled={!uploadFile || isUploading}
              className={`flex items-center px-4 py-2 rounded ${!uploadFile || isUploading ? 
                (darkMode ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed') : 
                (darkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600')}`}
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-1" />
                  {isDryRun ? 'Test Upload' : 'Upload'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {uploadResult && (
        <UploadResults 
          uploadResult={uploadResult} 
          isDryRun={isDryRun} 
          darkMode={darkMode} 
        />
      )}
    </div>
  );
};

export default DataUpload;
