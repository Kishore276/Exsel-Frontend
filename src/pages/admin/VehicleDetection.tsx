import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, Upload, Play, Pause, AlertTriangle, CheckCircle, Truck, Car, Recycle as Motorcycle } from 'lucide-react';
import { processVehicleFrame } from '../../utils/numberPlateDetection';
import { detectVehicles } from '../../utils/vehicleDetection';

interface DetectionResult {
  vehicleNumber: string;
  vehicleType: string;
  dimensions: {
    width: number;
    height: number;
    length: number;
  };
  confidence: number;
}

interface VehicleViolation {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  timestamp: Date;
  location: string;
  imageUrl?: string;
  dimensions?: {
    width: number;
    height: number;
    length: number;
  };
}

const VehicleDetection: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [detectionResults, setDetectionResults] = useState<DetectionResult | null>(null);
  const [violations, setViolations] = useState<VehicleViolation[]>([]);
  const [processingMessage, setProcessingMessage] = useState('');
  const [location, setLocation] = useState('Main Street No-Entry Zone');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [cameraPermission, setCameraPermission] = useState<boolean>(false);
  const [processingInterval, setProcessingInterval] = useState<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(() => setCameraPermission(true))
        .catch((err) => {
          console.error('Camera permission denied:', err);
          setCameraPermission(false);
        });
    }
    
    return () => {
      if (processingInterval) {
        clearInterval(processingInterval);
      }
    };
  }, []);

  const processFrame = async (imageSource: HTMLVideoElement | HTMLCanvasElement) => {
    setIsProcessing(true);
    setProcessingMessage('Processing frame...');
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = imageSource.videoWidth || imageSource.width;
      canvas.height = imageSource.videoHeight || imageSource.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      
      ctx.drawImage(imageSource, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      setProcessingMessage('Detecting vehicles...');
      const vehicles = await detectVehicles(imageSource);
      
      if (vehicles.length === 0) {
        setProcessingMessage('No vehicles detected');
        setIsProcessing(false);
        return;
      }
      
      setProcessingMessage('Processing detected vehicles...');
      
      const cameraParams = {
        focalLength: 35,
        sensorWidth: 23.5,
        distance: 10000
      };
      
      for (const vehicle of vehicles) {
        const vehicleCanvas = document.createElement('canvas');
        vehicleCanvas.width = vehicle.width;
        vehicleCanvas.height = vehicle.height;
        const vehicleCtx = vehicleCanvas.getContext('2d');
        
        if (vehicleCtx) {
          vehicleCtx.putImageData(
            ctx.getImageData(vehicle.x, vehicle.y, vehicle.width, vehicle.height),
            0,
            0
          );
          
          const result = await processVehicleFrame(
            vehicleCtx.getImageData(0, 0, vehicle.width, vehicle.height),
            location,
            cameraParams
          );
          
          if (result) {
            setDetectionResults({
              vehicleNumber: result.vehicleNumber,
              vehicleType: result.vehicleType,
              dimensions: result.dimensions,
              confidence: 0.95
            });
            
            const newViolation = {
              id: result.id,
              vehicleNumber: result.vehicleNumber,
              vehicleType: result.vehicleType,
              timestamp: new Date(),
              location: location,
              dimensions: result.dimensions
            };
            
            setViolations(prev => [newViolation, ...prev]);
            setShowSuccessAlert(true);
            setTimeout(() => setShowSuccessAlert(false), 3000);
          }
        }
      }
    } catch (error) {
      console.error('Error processing frame:', error);
      setErrorMessage('Error processing video frame');
      setShowErrorAlert(true);
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  };

  const toggleWebcam = () => {
    if (!isWebcamActive && !cameraPermission) {
      setErrorMessage('Camera permission is required');
      setShowErrorAlert(true);
      return;
    }
    
    if (isWebcamActive && processingInterval) {
      clearInterval(processingInterval);
      setProcessingInterval(null);
    } else if (!isWebcamActive && webcamRef.current) {
      const interval = setInterval(() => {
        if (webcamRef.current) {
          processFrame(webcamRef.current.video!);
        }
      }, 2000);
      
      setProcessingInterval(interval);
    }
    
    setIsWebcamActive(!isWebcamActive);
  };

  const handleWebcamCapture = () => {
    if (webcamRef.current && canvasRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (context) {
          const image = new Image();
          image.onload = () => {
            canvas.width = image.width;
            canvas.height = image.height;
            context.drawImage(image, 0, 0, image.width, image.height);
            
            processFrame(canvas);
          };
          image.src = imageSrc;
        }
      }
    }
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setUploadedVideo(files[0]);
    }
  };

  const handleVideoPlay = () => {
    if (videoRef.current && uploadedVideo) {
      if (!isVideoPlaying) {
        videoRef.current.play();
        setIsVideoPlaying(true);
      } else {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      }
    }
  };

  const handleProcessVideo = () => {
    if (videoRef.current) {
      processFrame(videoRef.current);
    }
  };

  const handleGenerateChallan = async (violation: VehicleViolation) => {
    try {
      let amount = 0;
      switch (violation.vehicleType) {
        case 'Car':
          amount = 500;
          break;
        case 'Truck':
          amount = 1000;
          break;
        case 'Bus':
          amount = 800;
          break;
        case 'Motorcycle':
          amount = 300;
          break;
        case 'Van':
          amount = 600;
          break;
        default:
          amount = 500;
      }
      
      amount += Math.floor(Math.random() * 200);
      
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
      
      setViolations(prev => prev.filter(v => v.id !== violation.id));
      
    } catch (error) {
      console.error('Error generating challan:', error);
      setErrorMessage('Failed to generate challan. Please try again.');
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 3000);
    }
  };

  useEffect(() => {
    return () => {
      if (uploadedVideo) {
        URL.revokeObjectURL(URL.createObjectURL(uploadedVideo));
      }
    };
  }, [uploadedVideo]);

  useEffect(() => {
    if (videoRef.current && uploadedVideo) {
      videoRef.current.src = URL.createObjectURL(uploadedVideo);
    }
  }, [uploadedVideo]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Vehicle No-Entry Detection</h1>
        <p className="mt-2 text-gray-600">
          Monitor no-entry zones and automatically detect violations using computer vision.
        </p>
      </div>
      
      {showSuccessAlert && (
        <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                Operation completed successfully!
              </p>
            </div>
          </div>
        </div>
      )}
      
      {showErrorAlert && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {errorMessage}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">
                  Detection Camera
                </h2>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={toggleWebcam}
                    className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md ${
                      isWebcamActive
                        ? 'text-red-700 bg-red-100 hover:bg-red-200'
                        : 'text-green-700 bg-green-100 hover:bg-green-200'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {isWebcamActive ? 'Stop Camera' : 'Start Camera'}
                  </button>
                  
                  {isWebcamActive && (
                    <button
                      type="button"
                      onClick={handleWebcamCapture}
                      disabled={isProcessing}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Camera className="h-4 w-4 mr-2" />
                          Capture Frame
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
                {!cameraPermission && !isWebcamActive ? (
                  <div className="flex flex-col items-center justify-center h-full py-12">
                    <Camera className="h-16 w-16 text-gray-400 mb-4" />
                    <p className="text-gray-500 text-center">
                      Camera permission is required.<br />
                      Please allow camera access to start detection.
                    </p>
                  </div>
                ) : isWebcamActive ? (
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="video/webm"
                    className="w-full h-full object-cover"
                    videoConstraints={{
                      width: 1280,
                      height: 720,
                      facingMode: "environment"
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-12">
                    <Camera className="h-16 w-16 text-gray-400 mb-4" />
                    <p className="text-gray-500 text-center">
                      Camera is currently inactive.<br />
                      Click "Start Camera" to begin detection.
                    </p>
                  </div>
                )}
                
                {isProcessing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <svg className="animate-spin h-10 w-10 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-lg font-medium">{processingMessage}</p>
                    </div>
                  </div>
                )}
                
                <canvas ref={canvasRef} className="hidden" />
              </div>
              
              <div className="mt-4">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Detection Location
                </label>
                <select
                  id="location"
                  name="location"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                >
                  <option value="Main Street No-Entry Zone">Main Street No-Entry Zone</option>
                  <option value="Downtown Restricted Area">Downtown Restricted Area</option>
                  <option value="School Zone">School Zone</option>
                  <option value="Hospital Area">Hospital Area</option>
                  <option value="One-Way Street">One-Way Street</option>
                </select>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-200">
        
              {<div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                <div className="flex-grow">
                  <label className="block">
                    <span className="sr-only">Choose video file</span>
                    <input 
                      type="file" 
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-medium
                        file:bg-indigo-50 file:text-indigo-700
                        hover:file:bg-indigo-100
                      "
                    />
                  </label>
                </div>
                
                {uploadedVideo && (
                  <>
                    <button
                      type="button"
                      onClick={handleVideoPlay}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      {isVideoPlaying ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Play
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleProcessVideo}
                      disabled={isProcessing}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {isProcessing ? 'Processing...' : 'Process Video'}
                    </button>
                  </>
                )}
              </div>
               }
              {uploadedVideo && (
                <div className="mt-3">
                  <video
                    ref={videoRef}
                    controls={false}
                    className="w-full h-auto rounded-md"
                    style={{ maxHeight: '200px' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Detection Results
              </h2>
            </div>
            
            {detectionResults ? (
              <div className="p-4">
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <h3 className="text-md font-medium text-gray-900 mb-2 flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Vehicle Detected
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-500">Vehicle Number</p>
                      <p className="text-sm font-medium">{detectionResults.vehicleNumber}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500">Vehicle Type</p>
                      <p className="text-sm font-medium">{detectionResults.vehicleType}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500">Confidence</p>
                      <p className="text-sm font-medium">{Math.round(detectionResults.confidence * 100)}%</p>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Vehicle Measurements
                  </h4>
                  
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-gray-500">Width</p>
                        <p className="text-sm font-medium">{detectionResults.dimensions.width} m</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500">Height</p>
                        <p className="text-sm font-medium">{detectionResults.dimensions.height} m</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500">Length</p>
                        <p className="text-sm font-medium">{detectionResults.dimensions.length} m</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center">
                <div className="py-6">
                  <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    No detection results yet.<br />
                    Capture a frame or process a video to see results.
                  </p>
                </div>
              </div>
            )}
            
            <div className="p-4 border-t border-gray-200">
              <h3 className="text-md font-medium text-gray-900 mb-3">
                Recent Violations
              </h3>
              
              {violations.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">
                    No violations detected yet.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {violations.map((violation) => (
                    <li key={violation.id} className="py-3">
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm font-medium text-indigo-600">
                            {violation.vehicleNumber}
                          </p>
                          <p className="text-xs text-gray-500">
                            {violation.vehicleType} • {violation.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleGenerateChallan(violation)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Generate Challan
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetection;