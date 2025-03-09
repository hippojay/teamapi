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
import DependencyMapPage from './pages/DependencyMapPage';
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
            <Route path="/users/:id" element={<UserDetailPage />} />
            
            {/* Dependencies */}
            <Route path="/dependencies" element={<DependencyMapPage />} />
            
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
