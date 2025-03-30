# Requirements Document for "Who What Where" Application

## Logging Requirements

1. Logs must follow a consistent format: `date - LEVEL - module - message`
2. Log messages should not include source file name and line number (logger.py:XXX) in the standard output
3. Log messages should include relevant contextual information for troubleshooting
4. System must support different log levels (DEBUG, INFO, WARNING, ERROR, CRITICAL)
5. All timestamps must display microseconds with proper formatting (using %f placeholder)

## Feature Requirements

1. Migrate from react-scripts to Vite for modern frontend development experience
2. Add support for other databases beyond SQLite
3. Find duplicated UI code and turn into React components
4. Scan and locate any security issues
5. Add TLS and auth to API calls
6. Ability to add areas, tribes and squads
7. Ability to rename structures based on needs
8. Ability to operate with a generic multi-layered approach
9. Add key people into Area and tribe view (such as area leadership and tribe leadership)
10. Add cost information, for areas/tribe run rates
11. Add historical views (go back in time to see what org was on X date)
12. Add future capacity view for team members, squads, tribes, areas
13. Add analytics views for data (cost, people, tribes, hot spots)
14. Add Team topologies analytics (dependencies hot spots, architectural hot spots)
15. Gather dependency data from repository contributions
16. Implement BDD UI testing to ensure application functionality

## UI Testing Requirements

1. As a user, I should be able to access the site and see all populated parts of the page without error messages
2. As a user, I should be able to navigate using the sidebar menu to new pages
3. As a user, I should be able to click into Areas and see all areas
4. As a user, I should be able to click into Tribes and see a summary of all tribes
5. As a user, I should be able to click into Squads and see a summary of all squads
6. As a user, I should be able to click into Team Members and see a list of team members
7. As a user, I should be able to click into Services and see all services
8. As a user, I should be able to click into the Organizational Explorer and see a summary of all areas
9. As a user, I should be able to click into OKRs and see a list of all OKRs

## BDD Testing Framework Requirements

1. The test framework must support Behavior-Driven Development (BDD) for clear stakeholder communication
2. Tests should be written in Gherkin syntax for readability by non-technical stakeholders
3. The testing solution should work in both headless and visual debug modes for different use cases
4. The testing framework should be compatible with WSL for developers using Windows Subsystem for Linux
5. Tests should include detailed logging and screenshot capture for troubleshooting failures
6. Test navigation should be resilient and support multiple methods to achieve the same goal
7. The framework should have proper error handling and clear error messages
8. All test dependencies must be properly declared in package.json
9. Test execution should be simplified with helper scripts for both normal and debug modes
10. The test framework should provide clear documentation for extending tests and troubleshooting common issues
