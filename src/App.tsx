import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UserDashboard from './pages/user/UserDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import ChallanPayment from './pages/user/ChallanPayment';
import ChallanHistory from './pages/user/ChallanHistory';
import AdminChallanHistory from './pages/admin/AdminChallanHistory';
import VehicleDetection from './pages/admin/VehicleDetection';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            
            {/* User Routes */}
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/challan-payment/:id" element={<ChallanPayment />} />
            <Route path="/user/challan-history" element={<ChallanHistory />} />
            
            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/challan-history" element={<AdminChallanHistory />} />
            <Route path="/admin/vehicle-detection" element={<VehicleDetection />} />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;