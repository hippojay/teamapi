# Logging Requirements for Who What Where

## Purpose
This document outlines the logging requirements and implementation for the "Who What Where" application to ensure better traceability of errors and events, and to facilitate AI-assisted troubleshooting.

## Requirements

### 1. Centralized Logging
- [x] All application logs should be consolidated in a single log file in addition to module-specific logs
- [x] The centralized log file should be named `application.log` and located in the `/logs` directory
- [x] The central log should capture all ERROR and CRITICAL level logs from throughout the application

### 2. Log Format
- [x] Logs must include timestamp with millisecond precision
- [x] Logs must include module/source name
- [x] Logs must include log level
- [x] Logs must include file name and line number for ERROR and WARNING logs
- [x] Logs must include thread information for better tracing of asynchronous operations
- [x] For ERROR and CRITICAL logs, exception information should be fully captured:
  - [x] Exception type
  - [x] Exception message
  - [x] Complete stack trace
  - [x] Contextual information related to the error

### 3. Structured Logging
- [x] Contextual information should be logged in a structured format (JSON) 
- [x] Key-value pairs should be used for structured metadata
- [x] Error logs should include all relevant state information needed for diagnosis

### 4. Log Levels
- [x] DEBUG: Detailed information for debugging issues
- [x] INFO: General information about system operations
- [x] WARNING: Issues that might cause problems but don't stop execution
- [x] ERROR: Errors that prevent specific operations from completing
- [x] CRITICAL: System-level failures that affect the entire application

### 5. Log Rotation
- [x] Module-specific logs should be rotated when they reach 10MB in size
- [x] Main application log should be rotated when it reaches 10MB in size
- [x] A maximum of 5 backup log files should be kept for each log

### 6. Exception Handling
- [x] All exceptions should be caught and properly logged
- [x] Exception logging should include the full stack trace
- [x] Exception handling should capture contextual information
- [x] Utility functions should be provided for consistent exception handling
- [x] Each exception should be logged with a clear and descriptive message

### 7. Metrics and Monitoring
- [x] Support for logging metrics and counters for monitoring purposes
- [x] Ability to track application performance through logs
- [x] Metrics should be tagged with relevant dimensions for analysis

### 8. AI-Assistant Compatibility
- [x] Logs should be formatted in a way that makes them easily parsable by AI tools
- [x] Structured data format (JSON) should be used for complex information
- [x] Error locations should be clearly identified (file, line number, function)
- [x] Clear cause-and-effect relationships should be identifiable in logs
- [x] State information should be captured to facilitate root cause analysis

### 9. System Information
- [x] System information should be logged at application startup
- [x] Python version, platform, hostname, and other environment information should be captured

### 10. Implementation
- [x] A centralized logging module should be provided for consistent logging across the application
- [x] Module-specific loggers should route errors to the central log file
- [x] Logging setup should be configurable through environment variables
- [x] Utility functions should be provided for common logging patterns

### 11. Operation-Specific Logging
- [x] Database operations should be logged with timing information
- [x] API endpoint calls should be logged with request/response information
- [x] Security-relevant events should be logged to a dedicated log
- [x] Data loading and processing operations should be logged with detailed metrics

### 12. Developer Experience
- [x] Utility decorators for common logging patterns
- [x] Consistent API for different log types
- [x] Clear documentation on logging best practices
- [x] Example code showing correct logging implementation

## Implementation Details

The logging system has been implemented using Python's built-in logging module with custom extensions:

### Core Components

1. **Central Logger Module (`logger.py`)**
   - Provides standardized logging interfaces
   - Supports both module-specific and centralized logging
   - Implements structured logging for complex events
   - Includes utility functions for exception handling

2. **Configuration (`logging_config.py`)**
   - Centralizes all logging configuration
   - Defines default log levels per module
   - Configures log file paths and rotation settings
   - Allows environment variable overrides

3. **Logging Utilities (`logging_utilities.py`)**
   - Decorators for timing operations
   - Functions for logging security events
   - Decorators for API endpoint logging
   - Database transaction logging
   - Exception contextualization

4. **Example Implementation (`logging_example.py`)**
   - Shows how to use all logging features
   - Provides templates for common scenarios
   - Demonstrates best practices

### Enhanced Features

1. **Structured JSON Logging**
   - All contextual information is logged in JSON format
   - Preserves data types for better analysis
   - Consistent key names across similar log events

2. **Smart Log Level Handling**
   - Different formats for different log levels
   - Detailed context for ERROR and WARNING logs
   - Concise format for INFO and DEBUG logs

3. **Security Event Logging**
   - Dedicated security log file
   - Special formatting for security events
   - Structured format for automated analysis

4. **Performance Tracking**
   - Automatic timers for database operations
   - API response time tracking
   - Transaction timing
   - Metric collection with dimensions

5. **Contextual Exception Handling**
   - Adds business context to exceptions
   - Links related logs for traceability
   - Captures request and user context
   - Preserves stack trace information

### Integration Status

The following key modules have been enhanced with comprehensive logging:

1. **Database Operations (`database.py`)**
   - Connection setup and errors
   - Schema creation and validation
   - Session management
   - Transaction tracking

2. **User Authentication (`user_auth.py`)**
   - Login attempts (success/failure)
   - Account creation and verification
   - Password resets
   - Permission checks
   - Security events

3. **Data Loading (`load_prod_data.py`)**
   - File parsing and validation
   - Data transformations
   - Database insertions
   - Error reporting with data context

4. **API Operations (`main.py`)**
   - Request validation
   - Response timing
   - Error handling
   - Authentication events

5. **Database Initialization (`db_initializer.py`)**
   - Schema creation
   - Migration tracking
   - Initialization errors
   - Configuration validation

### Usage Examples

1. **Structured Logging for Complex Operations**
   ```python
   logger.structured('INFO', 'Data processing operation', 
                    operation='process_upload', 
                    records_count=156, 
                    duration_ms=2344)
   ```

2. **Log Exceptions with Context**
   ```python
   try:
       # Operation that might fail
   except Exception as e:
       log_and_handle_exception(
           logger, 
           "Failed to process upload", 
           e,
           user_id=current_user.id,
           filename=upload.filename
       )
   ```

3. **Performance Tracking with Decorators**
   ```python
   @log_execution_time("database operation")
   def complex_database_query(params):
       # Function implementation
   ```

4. **API Endpoint Logging**
   ```python
   @app.post("/users/")
   @log_api_call(include_request_body=True, sensitive_params=["password"])
   def create_user(user: schemas.UserCreate):
       # Function implementation
   ```

5. **Security Event Logging**
   ```python
   log_security_event(
       "login_failed", 
       user_id=user_id,
       ip_address=request.client.host,
       reason="incorrect_password",
       attempt_count=failed_attempts
   )
   ```

## Future Enhancements

1. **Log Aggregation**
   - Integration with centralized logging system (e.g., ELK stack, Splunk)
   - Real-time log monitoring and alerting

2. **Analytics**
   - Performance dashboards based on collected metrics
   - Error trend analysis
   - Security event visualization

3. **Enhanced Debugging**
   - Request tracing across components
   - Correlation IDs for distributed operations
   - Log level adjustment at runtime

4. **Automated Issue Resolution**
   - AI-assisted troubleshooting based on structured logs
   - Automatic classification of errors
   - Suggested remediation actions

## Conclusion

The enhanced logging system provides comprehensive visibility into application operations, enabling efficient troubleshooting, performance monitoring, and security auditing. The structured format ensures compatibility with automated analysis tools and AI assistants, while the centralized configuration makes it easy to maintain consistent logging practices across the application.
