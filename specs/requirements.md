# Who What Where Portal - Requirements

## Identified User Needs

1. Fix ESLint errors in frontend code to ensure CI/CD builds pass successfully
   - Fix "Expected an error object to be thrown" errors in api.js
   - Fix unused variable warnings in various components
   - Fix equality operator warnings (== vs ===) in components
   - Fix React Hook dependency warnings in useEffect calls
   - Remove unused imports in components

2. Add Team Topologies enhancements as outlined in documentation
   - Add Team Type Classification (Stream-aligned, Platform, Enabling, Complicated-subsystem)
   - Enhance Dependency model with Interaction Modes
   - Add Team Cognitive Load Tracking
   - Add Team API Documentation
   - Add Domain Boundaries/Bounded Contexts
   - Add Evolution Tracking
   - Add Team Cognitive Load Assessment Tool
   - Add Feature and Value Stream Mapping

3. General feature improvements from the Feature to-do list
   - Add support for other databases
   - Find duplicated UI code and turn into React components
   - Scan and locate security issues
   - Add TLS and auth to API calls
   - Ability to add areas, tribes and squads
   - Ability to rename structures based on needs
   - Ability to operate with a generic multi-layered approach
   - Add key people into Area and tribe view
   - Add cost information for areas/tribes run rates
   - Add historical views
   - Add future capacity view for team members, squads, tribes, areas
   - Add analytics views for data
   - Add Team topologies analytics
   - Gather dependency data from repository contributions

4. Ensure code follows modern software engineering methods
   - Maintain modularity and ease of maintenance
   - Pay attention to security and data privacy
   - Prefer edits to existing files rather than complete rewrites
   - Ensure code changes are made in context

## Next Steps

1. Implement Team Topologies enhancements based on priority:
   - High Priority: Team Types Classification and Interaction Modes
   - Medium Priority: Team API Documentation and Domain Boundaries
   - Lower Priority: Evolution Tracking and Cognitive Load Assessment

2. Improve testing and code quality:
   - Add unit tests for new functionality
   - Consider adding integration tests for critical paths
   - Set up continuous linting and security scanning

3. Plan for database improvements:
   - Design migration path to support multiple database types
   - Ensure backward compatibility with existing SQLite database
