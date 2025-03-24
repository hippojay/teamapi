# Data Upload Feature Requirements

This document captures the user requirements for the data upload functionality added to the Who What Where application.

## Core Requirements

* Only administrators can upload data
* Within the admin settings, there is a new option called "Upload Data"
* Data will be uploaded using the same spreadsheet format as used previously
* A user can drag and drop the file, or browse for it - as normal behaviour for manipulating files
* Excel files with multiple worksheets are supported, allowing the user to select which worksheet to use
* The system automatically detects available worksheets in the uploaded Excel file
* Data will not be processed until the user clicks a button to start the data load
* When data processing is complete, a summary of volume changes will be provided as feedback
* A dry run option allows data to be processed without making changes to the database
* In dry run mode, the system reports the number of changes that would have been made
* Any data uploaded will only update or add entries - it will not delete or duplicate configuration
* Service data uploads are differentiated from organization data
* The system will be extended to include objectives and dependencies uploads in the future
* Data is sanitized before loading into the database to ensure validity and security

## Implementation Details

1. A new tab has been added to the Admin Dashboard called "Upload Data"
2. The user interface allows selection of data type (organization or services)
3. File upload component supports both drag-and-drop and file browser selection
4. Only Excel files (.xlsx, .xlsb, .xlsm, .xls) are accepted
5. Automatic worksheet detection and selection interface for Excel files
6. Smart defaulting of worksheets based on data type (e.g., "Services" sheet for services data)
7. A "Dry Run" checkbox allows testing uploads without making database changes
8. Processing status and results are clearly displayed to the user
9. Backend endpoint validates file type and user permissions
10. Security measures include:
   - Admin-only access
   - File type validation
   - Processing in a controlled environment
   - Proper error handling
11. Audit logging of all data upload activities

## Future Enhancements

* Support for objectives data upload
* Support for dependencies data upload
* Enhanced validation and error reporting
* Preview of changes before applying them
* Historical tracking of data uploads
* Scheduled/automated data uploads