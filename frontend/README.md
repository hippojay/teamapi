# Frontend for Who What Where - Team API Portal

This is the React frontend for the "Who What Where" team API portal.

## Getting Started

### Prerequisites

- Node.js 14 or higher
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

### Running the Development Server

```bash
npm start
```

The application will be available at http://localhost:3000.

## Testing

This project uses Vitest for unit testing React components.

```bash
# Run tests once
npm run test

# Run tests in watch mode
npm run test:watch
```

To add test coverage reporting:

```bash
# Add this to your package.json scripts
# "test:coverage": "vitest run --coverage"

# Then run
npm run test:coverage
```

## Project Structure

- `src/components/`: React components
- `src/pages/`: Page components
- `src/context/`: React context providers
- `src/utils/`: Utility functions
- `src/__tests__/`: Test files (can also be co-located with components)

## Writing Tests

Tests are written using Vitest and React Testing Library. Test files should be named with `.test.jsx` or `.spec.jsx` extensions.

Example test structure:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import YourComponent from '../YourComponent';

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `build/` directory.
