import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { firestore } from '../../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { AlertTriangle, Search, Download } from 'lucide-react';
import { Challan, getVehicleDescription, getViolationDescription, VehicleType } from '../../utils/challanUtils';
import vehicleData from '../../data/vehicleData.json';

const ChallanHistory: React.FC = () => {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid'>('all');
  const [filterVehicleType, setFilterVehicleType] = useState<VehicleType | 'all'>('all');

  useEffect(() => {
    const fetchChallans = async () => {
      try {
        const challansRef = collection(firestore, 'challans');
        const q = query(challansRef, orderBy('timestamp', 'desc'));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const challanList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp,
            paidAt: doc.data().paidAt,
          })) as Challan[];
          
          setChallans(challanList);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching challans:', error);
        setError('Failed to load challans');
      } finally {
        setLoading(false);
      }
    };

    fetchChallans();
  }, []);

  const formatDate = (timestamp: { toDate: () => Date }) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredChallans = challans.filter(challan => {
    const matchesSearch = challan.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         challan.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || challan.status === filterStatus;
    const matchesVehicleType = filterVehicleType === 'all' || challan.vehicleType === filterVehicleType;
    
    return matchesSearch && matchesStatus && matchesVehicleType;
  });

  const exportToCSV = () => {
    const headers = ['Vehicle Number', 'Vehicle Type', 'Violation Type', 'Location', 'Date', 'Amount', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredChallans.map(challan => [
        challan.vehicleNumber,
        getVehicleDescription(challan.vehicleType),
        getViolationDescription(challan.violationType),
        challan.location,
        formatDate(challan.timestamp),
        challan.amount,
        challan.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'challan_history.csv';
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
            <h2 className="text-lg font-medium text-red-800">Error</h2>
          </div>
          <p className="mt-2 text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Challan History</h1>
          <p className="mt-2 text-gray-600">View and manage your challan records.</p>
        </div>
        <button
          onClick={exportToCSV}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <Download className="h-4 w-4 mr-2" />
          Export to CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search by vehicle number or location"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'pending' | 'paid')}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              title="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Vehicle Type</label>
            <select
              value={filterVehicleType}
              onChange={(e) => setFilterVehicleType(e.target.value as VehicleType | 'all')}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              title="Filter by vehicle type"
            >
              <option value="all">All Vehicles</option>
              {Object.entries(vehicleData.vehicles).map(([type, data]) => (
                <option key={type} value={type}>{data.description}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Challans Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredChallans.length === 0 ? (
            <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
              No challans found
            </li>
          ) : (
            filteredChallans.map((challan) => (
              <li key={challan.id}>
                <Link
                  to={`/user/challan-payment/${challan.id}`}
                  className="block hover:bg-gray-50"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {challan.vehicleNumber}
                        </p>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          challan.status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {challan.status === 'paid' ? 'Paid' : 'Pending'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {getVehicleDescription(challan.vehicleType)}
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                          {getViolationDescription(challan.violationType)}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p className="text-sm font-medium text-gray-900">
                          ₹{challan.amount.toFixed(2)}
                        </p>
                        <p className="ml-4">
                          {formatDate(challan.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default ChallanHistory;