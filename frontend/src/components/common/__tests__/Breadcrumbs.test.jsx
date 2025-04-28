import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Breadcrumbs from '../Breadcrumbs';
import { ThemeProvider } from '../../../context/ThemeContext';

// Mock the useLocation hook
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({
      pathname: '/areas/engineering'
    })
  };
});

describe('Breadcrumbs Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('renders with provided items', () => {
    const items = [
      { label: 'Areas', path: '/areas', isLast: false },
      { label: 'Engineering', path: '/areas/engineering', isLast: true }
    ];

    render(
      <BrowserRouter>
        <ThemeProvider>
          <Breadcrumbs items={items} />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Check if all breadcrumb items are rendered
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Areas')).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    
    // Check if the last item doesn't have a link
    const areaLink = screen.getByText('Areas').closest('a');
    expect(areaLink).toHaveAttribute('href', '/areas');
    
    // Engineering should not be a link since it's the last item
    const engineeringElement = screen.getByText('Engineering');
    expect(engineeringElement.tagName).not.toBe('A');
  });

  it('renders without home link when showHomeLink is false', () => {
    const items = [
      { label: 'Areas', path: '/areas', isLast: false },
      { label: 'Engineering', path: '/areas/engineering', isLast: true }
    ];

    render(
      <BrowserRouter>
        <ThemeProvider>
          <Breadcrumbs items={items} showHomeLink={false} />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Home link should not be present
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
    
    // Other items should still be present
    expect(screen.getByText('Areas')).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
  });

  it('auto-generates breadcrumbs from path when no items provided', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <Breadcrumbs />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Should auto-generate from the mocked path '/areas/engineering'
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Areas')).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
  });
});
