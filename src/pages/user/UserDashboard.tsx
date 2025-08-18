import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface Challan {
  id: string;
  vehicleNumber: string;
  location: string;
  timestamp: Date;
  amount: number;
  status: 'pending' | 'paid';
  vehicleType: string;
  violationType: string;
}

const UserDashboard: React.FC = () => {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChallans = async () => {
      try {
        // Mock data for pending challans
        const mockChallans: Challan[] = [];
        
        for (let i = 1; i <= 3; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          
          mockChallans.push({
            id: `challan-${i}`,
            vehicleNumber: `AB ${Math.floor(Math.random() * 100)} CD ${Math.floor(Math.random() * 1000)}`,
            location: `Location ${i}`,
            timestamp: date,
            amount: 500 + Math.floor(Math.random() * 500),
            status: 'pending',
            vehicleType: ['Car', 'Motorcycle', 'Truck'][Math.floor(Math.random() * 3)],
            violationType: 'No-Entry Zone Violation'
          });
        }
        
        setChallans(mockChallans);
      } catch (error) {
        console.error('Error fetching challans:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChallans();
  }, []);

  const formatDate = (timestamp: Date) => {
    if (!timestamp) return 'N/A';
    
    return timestamp.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Pending Challans</h1>
        <p className="mt-2 text-gray-600">
          View and pay your pending challans. Timely payment helps avoid additional penalties.
        </p>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : challans.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Pending Challans</h3>
          <p className="mt-2 text-gray-600">
            You don't have any pending challans to pay. Thank you for being a responsible driver!
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {challans.map((challan) => (
              <li key={challan.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        {challan.vehicleNumber}
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        ₹{challan.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {challan.vehicleType} - {challan.violationType}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      <p>
                        Issued on <time dateTime={challan.timestamp.toISOString()}>{formatDate(challan.timestamp)}</time>
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between">
                    <div>
                      <span className="text-xs text-gray-500">Location: {challan.location}</span>
                    </div>
                    <div>
                      <Link
                        to={`/user/challan-payment/${challan.id}`}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Pay Now
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;