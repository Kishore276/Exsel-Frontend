import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Car, User, FileText, CreditCard, Camera } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();
  const userRole = location.pathname.includes('/admin') ? 'admin' : 'user';

  return (
    <nav className="bg-indigo-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={`/${userRole}/dashboard`} className="flex items-center">
              <Car className="h-8 w-8 mr-2" />
              <span className="font-bold text-xl">VehicleGuard</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {userRole === 'user' && (
              <>
                <Link 
                  to="/user/dashboard" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/user/dashboard' 
                      ? 'bg-indigo-800' 
                      : 'hover:bg-indigo-600'
                  }`}
                >
                  <div className="flex items-center">
                    <CreditCard className="h-4 w-4 mr-1" />
                    <span>Challans</span>
                  </div>
                </Link>
                <Link 
                  to="/user/challan-history" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/user/challan-history' 
                      ? 'bg-indigo-800' 
                      : 'hover:bg-indigo-600'
                  }`}
                >
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    <span>History</span>
                  </div>
                </Link>
              </>
            )}
            
            {userRole === 'admin' && (
              <>
                <Link 
                  to="/admin/dashboard" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/admin/dashboard' 
                      ? 'bg-indigo-800' 
                      : 'hover:bg-indigo-600'
                  }`}
                >
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    <span>Dashboard</span>
                  </div>
                </Link>
                <Link 
                  to="/admin/vehicle-detection" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/admin/vehicle-detection' 
                      ? 'bg-indigo-800' 
                      : 'hover:bg-indigo-600'
                  }`}
                >
                  <div className="flex items-center">
                    <Camera className="h-4 w-4 mr-1" />
                    <span>Detection</span>
                  </div>
                </Link>
                <Link 
                  to="/admin/challan-history" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/admin/challan-history' 
                      ? 'bg-indigo-800' 
                      : 'hover:bg-indigo-600'
                  }`}
                >
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    <span>Challan History</span>
                  </div>
                </Link>
              </>
            )}
            
            <Link 
              to={userRole === 'admin' ? '/user/dashboard' : '/admin/dashboard'}
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-600"
            >
              <div className="flex items-center">
                <span>Switch to {userRole === 'admin' ? 'User' : 'Admin'}</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;