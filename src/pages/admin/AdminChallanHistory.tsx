import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Search, Download } from 'lucide-react';

interface Challan {
  id: string;
  vehicleNumber: string;
  location: string;
  timestamp: Date;
  amount: number;
  status: 'pending' | 'paid';
  vehicleType: string;
  violationType: string;
  paidAt?: Date;
  userId: string;
}

const AdminChallanHistory: React.FC = () => {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('all');
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);

  useEffect(() => {
    // Simulate API call with mock data
    const fetchChallans = async () => {
      try {
        // Generate mock data
        const mockChallans: Challan[] = [];
        const mockVehicleTypes = ['Car', 'Truck', 'Motorcycle', 'Bus', 'Van'];
        
        for (let i = 1; i <= 20; i++) {
          const vehicleType = mockVehicleTypes[Math.floor(Math.random() * mockVehicleTypes.length)];
          const status = Math.random() > 0.5 ? 'paid' : 'pending';
          const date = new Date();
          date.setDate(date.getDate() - Math.floor(Math.random() * 30));
          
          mockChallans.push({
            id: `challan-${i}`,
            vehicleNumber: `AB ${Math.floor(Math.random() * 100)} CD ${Math.floor(Math.random() * 1000)}`,
            location: `Location ${i % 5 + 1}`,
            timestamp: date,
            amount: 500 + Math.floor(Math.random() * 1000),
            status,
            vehicleType,
            violationType: 'No-Entry Zone Violation',
            paidAt: status === 'paid' ? new Date() : undefined,
            userId: `user-${i % 3 + 1}`
          });
        }
        
        setChallans(mockChallans);
        setVehicleTypes(mockVehicleTypes);
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

  const filteredChallans = challans.filter(challan => {
    // Filter by status
    if (filter !== 'all' && challan.status !== filter) {
      return false;
    }
    
    // Filter by vehicle type
    if (vehicleTypeFilter !== 'all' && challan.vehicleType !== vehicleTypeFilter) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm && !challan.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const exportToCSV = () => {
    const headers = ['Vehicle Number', 'Vehicle Type', 'Violation Type', 'Amount', 'Status', 'Date', 'Location'];
    
    const csvData = filteredChallans.map(challan => [
      challan.vehicleNumber,
      challan.vehicleType,
      challan.violationType,
      challan.amount.toFixed(2),
      challan.status,
      formatDate(challan.timestamp),
      challan.location
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `challan_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Challan History</h1>
        <p className="mt-2 text-gray-600">
          Complete history of all challan records in the system.
        </p>
      </div>
      
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search by Vehicle Number
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                name="search"
                id="search"
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Enter vehicle number"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              name="status-filter"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'paid' | 'pending')}
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="vehicle-type-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle Type
            </label>
            <select
              id="vehicle-type-filter"
              name="vehicle-type-filter"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={vehicleTypeFilter}
              onChange={(e) => setVehicleTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              {vehicleTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={exportToCSV}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Export to CSV
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : filteredChallans.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Challans Found</h3>
          <p className="mt-2 text-gray-600">
            No challan records match your current filters.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle Number
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Violation
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredChallans.map((challan) => (
                  <tr key={challan.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-indigo-600">
                        {challan.vehicleNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{challan.vehicleType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{challan.violationType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{challan.amount.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        challan.status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {challan.status === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(challan.timestamp)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{challan.location}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminChallanHistory;