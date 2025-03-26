# Organization Explorer Requirements

This document outlines the requirements for the Organization Explorer feature in the "Who What Where" application.

## User Needs

1. Access a dedicated page to quickly navigate and explore the organizational structure
2. View the structure in a hierarchical format (Areas > Tribes > Squads)
3. Collapse and expand areas and tribes to focus on specific parts of the organization
4. See status indicators for areas, tribes, and squads
5. Display the number of squads contained within each area and tribe
6. Provide buttons to expand or collapse all areas and tribes at once
7. Replicate the box-style display from the admin pages but focus purely on visualization
8. Include the feature in the main navigation sidebar for easy access
9. Display status labels and other metadata alongside each component in the hierarchy
10. Maintain consistency with the existing UI design system and color themes

## Technical Requirements

1. Fetch organizational data from the existing API endpoints
2. Implement state management for tracking expanded/collapsed states
3. Maintain responsive design for different screen sizes
4. Support dark mode toggling
5. Optimize performance when rendering large organizational structures
6. Handle loading and error states appropriately
