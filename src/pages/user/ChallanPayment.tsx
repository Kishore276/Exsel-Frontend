import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { firestore } from '../../firebase';
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Challan } from '../../utils/challanUtils';
import { CreditCard, Wallet, AlertCircle, CheckCircle } from 'lucide-react';
import vehicleData from '../../data/vehicleData.json';

const ChallanPayment: React.FC = () => {
  const { challanId } = useParams<{ challanId: string }>();
  const navigate = useNavigate();
  const [challan, setChallan] = useState<Challan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet' | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchChallan = async () => {
      try {
        if (!challanId) {
          setError('Challan ID not found');
          return;
        }

        const challanDoc = await getDoc(doc(firestore, 'challans', challanId));
        if (!challanDoc.exists()) {
          setError('Challan not found');
          return;
        }

        setChallan(challanDoc.data() as Challan);
      } catch (error) {
        console.error('Error fetching challan:', error);
        setError('Failed to load challan details');
      } finally {
        setLoading(false);
      }
    };

    fetchChallan();
  }, [challanId]);

  const handlePayment = async () => {
    if (!challan || !paymentMethod) return;

    try {
      setProcessing(true);
      const challanRef = doc(firestore, 'challans', challanId!);
      
      await updateDoc(challanRef, {
        status: 'paid',
        paidAt: serverTimestamp(),
        paymentMethod,
      });

      setShowSuccess(true);
      setTimeout(() => {
        navigate('/user/challan-history');
      }, 2000);
    } catch (error) {
      console.error('Error processing payment:', error);
      setError('Failed to process payment');
    } finally {
      setProcessing(false);
    }
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
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <h2 className="text-lg font-medium text-red-800">Error</h2>
          </div>
          <p className="mt-2 text-red-700">{error}</p>
          <button
            onClick={() => navigate('/user/challan-history')}
            className="mt-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            Back to History
          </button>
        </div>
      </div>
    );
  }

  if (!challan) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
            <h2 className="text-lg font-medium text-yellow-800">Not Found</h2>
          </div>
          <p className="mt-2 text-yellow-700">The requested challan could not be found.</p>
          <button
            onClick={() => navigate('/user/challan-history')}
            className="mt-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700"
          >
            Back to History
          </button>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
            <h2 className="text-lg font-medium text-green-800">Payment Successful!</h2>
          </div>
          <p className="mt-2 text-green-700">Your challan has been paid successfully.</p>
          <p className="mt-2 text-green-700">Redirecting to challan history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Challan Payment</h2>
          
          {/* Challan Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Challan Details</h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Vehicle Number</dt>
                <dd className="mt-1 text-sm text-gray-900">{challan.vehicleNumber}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Vehicle Type</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {vehicleData.vehicles[challan.vehicleType].description}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Violation Type</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {vehicleData.violations[challan.violationType].description}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900">{challan.location}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {(challan.timestamp as Timestamp).toDate().toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                <dd className="mt-1 text-sm font-semibold text-indigo-600">
                  ₹{challan.amount.toFixed(2)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Payment Method</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                onClick={() => setPaymentMethod('card')}
                className={`flex items-center justify-center p-4 border rounded-lg ${
                  paymentMethod === 'card'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-300 hover:border-indigo-500'
                }`}
              >
                <CreditCard className="h-6 w-6 mr-2 text-indigo-600" />
                <span className="text-sm font-medium text-gray-900">Credit/Debit Card</span>
              </button>
              <button
                onClick={() => setPaymentMethod('wallet')}
                className={`flex items-center justify-center p-4 border rounded-lg ${
                  paymentMethod === 'wallet'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-300 hover:border-indigo-500'
                }`}
              >
                <Wallet className="h-6 w-6 mr-2 text-indigo-600" />
                <span className="text-sm font-medium text-gray-900">Digital Wallet</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => navigate('/user/challan-history')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={!paymentMethod || processing}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                !paymentMethod || processing
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {processing ? 'Processing...' : 'Pay Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallanPayment;