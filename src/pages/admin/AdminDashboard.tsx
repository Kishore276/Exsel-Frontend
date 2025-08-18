import React, { useState, useEffect } from 'react';
import { firestore } from '../../firebase';
import { collection, query, addDoc, onSnapshot } from 'firebase/firestore';
import vehicleData from '../../data/vehicleData.json';
import { Challan, ViolationType, VehicleType } from '../../utils/challanUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FileText, CheckCircle, Clock, Plus, DollarSign } from 'lucide-react';

interface Statistics {
  totalChallans: number;
  pendingChallans: number;
  paidChallans: number;
  totalRevenue: number;
  violationStats: Record<ViolationType, number>;
  vehicleTypeStats: Record<VehicleType, number>;
}

const AdminDashboard: React.FC = () => {
  const [statistics, setStatistics] = useState<Statistics>(vehicleData.statistics);
  const [loading, setLoading] = useState(true);
  const [showAddChallan, setShowAddChallan] = useState(false);
  const [newChallan, setNewChallan] = useState<Partial<Challan>>({
    vehicleNumber: '',
    vehicleType: 'car',
    violationType: 'speeding',
    location: '',
    status: 'pending',
  });

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const challansRef = collection(firestore, 'challans');
        const q = query(challansRef);
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const stats: Statistics = {
            ...vehicleData.statistics,
            violationStats: { ...vehicleData.statistics.violationStats },
            vehicleTypeStats: { ...vehicleData.statistics.vehicleTypeStats }
          };

          querySnapshot.forEach((doc) => {
            const challan = doc.data() as Challan;
            stats.totalChallans++;
            
            if (challan.status === 'paid') {
              stats.paidChallans++;
              stats.totalRevenue += challan.amount;
            } else {
              stats.pendingChallans++;
            }

            stats.violationStats[challan.violationType]++;
            stats.vehicleTypeStats[challan.vehicleType]++;
          });

          setStatistics(stats);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  const handleAddChallan = async () => {
    try {
      const challanData: Omit<Challan, 'id'> = {
        ...newChallan,
        timestamp: new Date(),
        userId: 'user123', // Replace with actual user ID
        amount: vehicleData.violations[newChallan.violationType as ViolationType].amount +
                vehicleData.vehicles[newChallan.vehicleType as VehicleType].baseAmount,
      } as Omit<Challan, 'id'>;

      await addDoc(collection(firestore, 'challans'), challanData);
      setShowAddChallan(false);
      setNewChallan({
        vehicleNumber: '',
        vehicleType: 'car',
        violationType: 'speeding',
        location: '',
        status: 'pending',
      });
    } catch (error) {
      console.error('Error adding challan:', error);
    }
  };

  const violationChartData = Object.entries(statistics.violationStats).map(([type, count]) => ({
    name: vehicleData.violations[type as ViolationType].description,
    count,
  }));

  const vehicleChartData = Object.entries(statistics.vehicleTypeStats).map(([type, count]) => ({
    name: vehicleData.vehicles[type as VehicleType].description,
    count,
  }));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Monitor challan statistics and manage challans.</p>
        </div>
        <button
          onClick={() => setShowAddChallan(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Challan
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Challans</dt>
                  <dd className="text-lg font-medium text-gray-900">{statistics.totalChallans}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Challans</dt>
                  <dd className="text-lg font-medium text-gray-900">{statistics.pendingChallans}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Paid Challans</dt>
                  <dd className="text-lg font-medium text-gray-900">{statistics.paidChallans}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="text-lg font-medium text-gray-900">₹{statistics.totalRevenue.toFixed(2)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Violations by Type</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={violationChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#4F46E5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Challans by Vehicle Type</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vehicleChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Add Challan Modal */}
      {showAddChallan && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Challan</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Vehicle Number</label>
                <input
                  type="text"
                  value={newChallan.vehicleNumber}
                  onChange={(e) => setNewChallan({ ...newChallan, vehicleNumber: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter vehicle number"
                  title="Vehicle Number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Vehicle Type</label>
                <select
                  value={newChallan.vehicleType}
                  onChange={(e) => setNewChallan({ ...newChallan, vehicleType: e.target.value as VehicleType })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  title="Vehicle Type"
                >
                  {Object.entries(vehicleData.vehicles).map(([type, data]) => (
                    <option key={type} value={type}>{data.description}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Violation Type</label>
                <select
                  value={newChallan.violationType}
                  onChange={(e) => setNewChallan({ ...newChallan, violationType: e.target.value as ViolationType })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  title="Violation Type"
                >
                  {Object.entries(vehicleData.violations).map(([type, data]) => (
                    <option key={type} value={type}>{data.description}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={newChallan.location}
                  onChange={(e) => setNewChallan({ ...newChallan, location: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter location"
                  title="Location"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddChallan(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddChallan}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Add Challan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;