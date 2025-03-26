import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import components
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import AreasPage from './pages/AreasPage';
import AreaDetailPage from './pages/AreaDetailPage';
import TribesPage from './pages/TribesPage';
import TribeDetailPage from './pages/TribeDetailPage';
import SquadsPage from './pages/SquadsPage';
import SquadDetailPage from './pages/SquadDetailPage';
import ServicesPage from './pages/ServicesPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import UserDetailPage from './pages/UserDetailPage';
import UsersPage from './pages/UsersPage';
import MyProfileRedirect from './components/users/MyProfileRedirect';
import DependencyMapPage from './pages/DependencyMapPage';
import OrgExplorerPage from './pages/org-explorer';
import OKRsPage from './pages/OKRsPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import RegisterForm from './components/RegisterForm';
import LoginPage from './pages/LoginPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import PasswordResetRequestPage from './pages/PasswordResetRequestPage';
import PasswordResetPage from './pages/PasswordResetPage';
import NotFoundPage from './pages/NotFoundPage';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
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
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
