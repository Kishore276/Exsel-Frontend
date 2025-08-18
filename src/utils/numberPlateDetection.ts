import { createWorker } from 'tesseract.js';
import { firestore } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { calculateVehicleDimensions, classifyVehicleType } from './vehicleDetection';

let worker: Tesseract.Worker | null = null;

export const initTesseract = async () => {
  if (!worker) {
    worker = await createWorker('eng');
  }
  return worker;
};

export const detectNumberPlate = async (imageData: ImageData): Promise<string | null> => {
  try {
    const tesseract = await initTesseract();
    const result = await tesseract.recognize(imageData);
    
    // Extract text that matches number plate pattern (e.g., AB 12 CD 3456)
    const text = result.data.text;
    const numberPlateRegex = /[A-Z]{2}\s*\d{2}\s*[A-Z]{2}\s*\d{4}/g;
    const matches = text.match(numberPlateRegex);
    
    return matches ? matches[0] : null;
  } catch (error) {
    console.error('Error detecting number plate:', error);
    return null;
  }
};

export const processVehicleFrame = async (
  imageData: ImageData,
  location: string,
  cameraParams: { focalLength: number; sensorWidth: number; distance: number }
) => {
  try {
    // Detect number plate
    const numberPlate = await detectNumberPlate(imageData);
    if (!numberPlate) {
      return null;
    }

    // Calculate vehicle dimensions
    const boundingBox = {
      width: imageData.width,
      height: imageData.height
    };
    const dimensions = calculateVehicleDimensions(boundingBox, cameraParams);
    
    // Classify vehicle type
    const vehicleType = classifyVehicleType(dimensions);
    
    // Calculate fine based on vehicle type
    const fineAmount = calculateFine(vehicleType);
    
    // Create challan in Firestore
    const challanRef = await addDoc(collection(firestore, 'challans'), {
      vehicleNumber: numberPlate,
      vehicleType,
      location,
      timestamp: serverTimestamp(),
      amount: fineAmount,
      status: 'pending',
      violationType: 'No-Entry Zone Violation',
      dimensions
    });

    return {
      id: challanRef.id,
      vehicleNumber: numberPlate,
      vehicleType,
      dimensions,
      fineAmount
    };
  } catch (error) {
    console.error('Error processing vehicle frame:', error);
    return null;
  }
};

const calculateFine = (vehicleType: string): number => {
  const baseFines = {
    'Motorcycle': 500,
    'Car': 1000,
    'Van': 1500,
    'Bus': 2000,
    'Truck': 2500
  };
  
  return baseFines[vehicleType as keyof typeof baseFines] || 1000;
};