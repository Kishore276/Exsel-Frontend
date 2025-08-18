import React from 'react';
import { Car, Mail, Phone, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <Car className="h-6 w-6 mr-2" />
              <h3 className="text-xl font-bold">VehicleGuard</h3>
            </div>
            <p className="text-gray-300 mb-4">
              Advanced vehicle no-entry detection system with automated challan generation and payment processing.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-white">About Us</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white">Services</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white">FAQ</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white">Privacy Policy</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-indigo-400" />
                <span className="text-gray-300">KALASALINGAM UNIVERSITY</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 mr-2 text-indigo-400" />
                <span className="text-gray-300">+91 9581440276</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-indigo-400" />
                <span className="text-gray-300">g,yuvakishorereddy@gmail.com</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} VehicleGuard. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;