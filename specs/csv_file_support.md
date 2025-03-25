# CSV File Support Requirements

## Overview
The "Who What Where" portal needs to support CSV files for data imports, especially for:
1. Organisation structure data
2. Services data
3. Dependencies data

## General Requirements
- The system should accept CSV files with the `.csv` extension
- CSV files should be parsed with appropriate headers and data types
- Data validation should be applied to ensure data integrity
- Error handling should provide clear messages for invalid data

## Specific Implementation Details

### 1. Organisation Structure Data
CSV files for organisation structure should contain the following columns:
- Area
- Tribe
- Squad
- Name
- Business Email Address
- Position
- Current Phasing
- Work Geography
- Work City
- Regular / Temporary
- Supervisor Name
- Vendor Name
- Function

### 2. Services Data
CSV files for services should contain the following columns:
- Service Name
- Squad Name
- Description
- Type
- URL
- Version

### 3. Dependencies Data
CSV files for dependencies must contain the following columns:
- Dependent Squad
- Dependency Squad
- Dependency Name
- Interaction Mode (must be one of: x_as_a_service, collaboration, facilitating)
- Interaction Frequency (optional, can be: Regular, As needed, Scheduled)

## Frontend Changes
- Update file selection to accept CSV files
- Update validation logic to handle CSV files appropriately
- Update the UI to provide guidance on the expected format
- Add support for dependencies data type in the upload form

## Backend Changes
- Update file handling code to detect and properly process CSV files
- Add CSV parsing logic using pandas
- Add appropriate error handling for malformed CSV files
- Create a dedicated module for loading dependencies from CSV

## Benefits
- Easier data import for users who prefer working with CSV files
- Simplified workflow for specific data types like dependencies
- Better integration with external systems and data sources
- Support for standard data interchange formats
