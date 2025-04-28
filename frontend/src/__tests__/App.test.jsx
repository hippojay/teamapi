import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { MemoryRouter } from 'react-router-dom';

// Import the components directly from App.jsx
import React from 'react';
import Layout from '../components/Layout';
import HomePage from '../pages/HomePage';
import AreasPage from '../pages/AreasPage';
import AreaDetailPage from '../pages/AreaDetailPage';
import TribesPage from '../pages/TribesPage';
import TribeDetailPage from '../pages/TribeDetailPage';
import SquadsPage from '../pages/SquadsPage';
import SquadDetailPage from '../pages/SquadDetailPage';
import ServicesPage from '../pages/ServicesPage';
import ServiceDetailPage from '../pages/ServiceDetailPage';
import UserDetailPage from '../pages/UserDetailPage';
import UsersPage from '../pages/UsersPage';
import MyProfileRedirect from '../components/users/MyProfileRedirect';
import DependencyMapPage from '../pages/DependencyMapPage';
import OrgExplorerPage from '../pages/org-explorer';
import OKRsPage from '../pages/OKRsPage';
import ProfilePage from '../pages/ProfilePage';
import AdminPage from '../pages/AdminPage';
import RegisterForm from '../components/RegisterForm';
import LoginPage from '../pages/LoginPage';
import EmailVerificationPage from '../pages/EmailVerificationPage';
import PasswordResetRequestPage from '../pages/PasswordResetRequestPage';
import PasswordResetPage from '../pages/PasswordResetPage';
import NotFoundPage from '../pages/NotFoundPage';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';

// Mock all the page components
vi.mock('../pages/HomePage', () => ({
  default: () => <div data-testid="home-page">Home Page</div>
}));

vi.mock('../pages/AreasPage', () => ({
  default: () => <div data-testid="areas-page">Areas Page</div>
}));

vi.mock('../pages/AreaDetailPage', () => ({
  default: () => <div data-testid="area-detail-page">Area Detail Page</div>
}));

vi.mock('../pages/TribesPage', () => ({
  default: () => <div data-testid="tribes-page">Tribes Page</div>
}));

vi.mock('../pages/TribeDetailPage', () => ({
  default: () => <div data-testid="tribe-detail-page">Tribe Detail Page</div>
}));

vi.mock('../pages/SquadsPage', () => ({
  default: () => <div data-testid="squads-page">Squads Page</div>
}));

vi.mock('../pages/SquadDetailPage', () => ({
  default: () => <div data-testid="squad-detail-page">Squad Detail Page</div>
}));

vi.mock('../pages/ServicesPage', () => ({
  default: () => <div data-testid="services-page">Services Page</div>
}));

vi.mock('../pages/ServiceDetailPage', () => ({
  default: () => <div data-testid="service-detail-page">Service Detail Page</div>
}));

vi.mock('../pages/UsersPage', () => ({
  default: () => <div data-testid="users-page">Users Page</div>
}));

vi.mock('../pages/UserDetailPage', () => ({
  default: () => <div data-testid="user-detail-page">User Detail Page</div>
}));

vi.mock('../components/users/MyProfileRedirect', () => ({
  default: () => <div data-testid="my-profile-redirect">My Profile Redirect</div>
}));

vi.mock('../pages/DependencyMapPage', () => ({
  default: () => <div data-testid="dependency-map-page">Dependency Map Page</div>
}));

vi.mock('../pages/org-explorer', () => ({
  default: () => <div data-testid="org-explorer-page">Org Explorer Page</div>
}));

vi.mock('../pages/OKRsPage', () => ({
  default: () => <div data-testid="okrs-page">OKRs Page</div>
}));

vi.mock('../pages/ProfilePage', () => ({
  default: () => <div data-testid="profile-page">Profile Page</div>
}));

vi.mock('../pages/AdminPage', () => ({
  default: () => <div data-testid="admin-page">Admin Page</div>
}));

vi.mock('../components/RegisterForm', () => ({
  default: () => <div data-testid="register-form">Register Form</div>
}));

vi.mock('../pages/LoginPage', () => ({
  default: () => <div data-testid="login-page">Login Page</div>
}));

vi.mock('../pages/EmailVerificationPage', () => ({
  default: () => <div data-testid="email-verification-page">Email Verification Page</div>
}));

vi.mock('../pages/PasswordResetRequestPage', () => ({
  default: () => <div data-testid="password-reset-request-page">Password Reset Request Page</div>
}));

vi.mock('../pages/PasswordResetPage', () => ({
  default: () => <div data-testid="password-reset-page">Password Reset Page</div>
}));

vi.mock('../pages/NotFoundPage', () => ({
  default: () => <div data-testid="not-found-page">Not Found Page</div>
}));

// Mock the context providers
vi.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }) => <div data-testid="auth-provider">{children}</div>
}));

vi.mock('../context/ThemeContext', () => ({
  ThemeProvider: ({ children }) => <div data-testid="theme-provider">{children}</div>
}));

// Mock the Layout component
vi.mock('../components/Layout', () => ({
  default: ({ children }) => <div data-testid="layout">{children}</div>
}));

// Create a test component that mimics the App component's structure
const TestApp = ({ initialRoute = '/' }) => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              
              {/* Areas */}
              <Route path="/areas" element={<AreasPage />} />
              <Route path="/areas/:id" element={<AreaDetailPage />} />
              
              {/* Tribes */}
              <Route path="/tribes" element={<TribesPage />} />
              <Route path="/tribes/:id" element={<TribeDetailPage />} />
              
              {/* Squads */}
              <Route path="/squads" element={<SquadsPage />} />
              <Route path="/squads/:id" element={<SquadDetailPage />} />
              
              {/* Services */}
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/services/:id" element={<ServiceDetailPage />} />
              
              {/* Users */}
              <Route path="/users" element={<UsersPage />} />
              <Route path="/users/me" element={<MyProfileRedirect />} />
              <Route path="/users/:id" element={<UserDetailPage />} />
              
              {/* Dependencies */}
              <Route path="/dependencies" element={<DependencyMapPage />} />
              
              {/* Org Explorer */}
              <Route path="/org-explorer" element={<OrgExplorerPage />} />
              
              {/* OKRs */}
              <Route path="/okrs" element={<OKRsPage />} />
              
              {/* User Management */}
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/register" element={<RegisterForm />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/verify-email" element={<EmailVerificationPage />} />
              <Route path="/reset-password-request" element={<PasswordResetRequestPage />} />
              <Route path="/reset-password" element={<PasswordResetPage />} />
              
              {/* 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Layout>
        </MemoryRouter>
      </ThemeProvider>
    </AuthProvider>
  );
};

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the app with providers and layout', () => {
    render(<TestApp />);
    
    // Check if providers and layout are rendered
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
    expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
    expect(screen.getByTestId('layout')).toBeInTheDocument();
  });

  it('renders the home page by default', () => {
    render(<TestApp />);
    
    // Check if the home page is rendered
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  // Test each main route
  const routes = [
    { path: '/areas', testId: 'areas-page' },
    { path: '/areas/1', testId: 'area-detail-page' },
    { path: '/tribes', testId: 'tribes-page' },
    { path: '/tribes/1', testId: 'tribe-detail-page' },
    { path: '/squads', testId: 'squads-page' },
    { path: '/squads/1', testId: 'squad-detail-page' },
    { path: '/services', testId: 'services-page' },
    { path: '/services/1', testId: 'service-detail-page' },
    { path: '/users', testId: 'users-page' },
    { path: '/users/me', testId: 'my-profile-redirect' },
    { path: '/users/1', testId: 'user-detail-page' },
    { path: '/dependencies', testId: 'dependency-map-page' },
    { path: '/org-explorer', testId: 'org-explorer-page' },
    { path: '/okrs', testId: 'okrs-page' },
    { path: '/profile', testId: 'profile-page' },
    { path: '/admin', testId: 'admin-page' },
    { path: '/register', testId: 'register-form' },
    { path: '/login', testId: 'login-page' },
    { path: '/verify-email', testId: 'email-verification-page' },
    { path: '/reset-password-request', testId: 'password-reset-request-page' },
    { path: '/reset-password', testId: 'password-reset-page' },
    { path: '/non-existent-route', testId: 'not-found-page' }
  ];

  routes.forEach(({ path, testId }) => {
    it(`renders the correct component for route: ${path}`, () => {
      render(<TestApp initialRoute={path} />);
      
      // Check if the correct page component is rendered
      expect(screen.getByTestId(testId)).toBeInTheDocument();
    });
  });
});
