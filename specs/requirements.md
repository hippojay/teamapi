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
