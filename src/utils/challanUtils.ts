import { firestore } from '../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp, orderBy, getDoc, Timestamp } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import challanData from '../data/challanData.json';

export type ViolationType = keyof typeof challanData.violationTypes;
export type VehicleType = keyof typeof challanData.vehicleTypes;

/**
 * Interface for Challan data
 */
export interface Challan {
  id: string;
  vehicleNumber: string;
  location: string;
  timestamp: Timestamp;
  amount: number;
  status: 'pending' | 'paid';
  vehicleType: VehicleType;
  violationType: ViolationType;
  userId: string;
  paidAt?: Timestamp;
  paymentMethod?: 'card' | 'wallet';
}

/**
 * Get all challans for a specific user
 * @param userId User ID
 * @returns Promise with array of challans
 */
export const getUserChallans = async (userId: string): Promise<Challan[]> => {
  try {
    const q = query(
      collection(firestore, 'challans'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const challans: Challan[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      challans.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp as Timestamp,
        paidAt: data.paidAt as Timestamp,
      } as Challan);
    });

    return challans;
  } catch (error) {
    console.error('Error fetching user challans:', error);
    throw error;
  }
};

/**
 * Get all pending challans for a specific user
 * @param userId User ID
 * @returns Promise with array of pending challans
 */
export const getPendingChallans = async (userId: string): Promise<Challan[]> => {
  try {
    const q = query(
      collection(firestore, 'challans'),
      where('userId', '==', userId),
      where('status', '==', 'pending')
    );

    const querySnapshot = await getDocs(q);
    const challans: Challan[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      challans.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp as Timestamp,
        paidAt: data.paidAt as Timestamp,
      } as Challan);
    });

    return challans;
  } catch (error) {
    console.error('Error fetching pending challans:', error);
    throw error;
  }
};

/**
 * Get a specific challan by ID
 * @param challanId Challan ID
 * @returns Promise with challan data
 */
export const getChallanById = async (challanId: string): Promise<Challan | null> => {
  try {
    const docRef = doc(firestore, 'challans', challanId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        timestamp: data.timestamp as Timestamp,
        paidAt: data.paidAt as Timestamp,
      } as Challan;
    }

    return null;
  } catch (error) {
    console.error('Error fetching challan:', error);
    throw error;
  }
};

/**
 * Create a new challan
 * @param challanData Challan data
 * @returns Promise with new challan ID
 */
export const createChallan = async (challanData: Omit<Challan, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(firestore, 'challans'), {
      ...challanData,
      timestamp: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating challan:', error);
    throw error;
  }
};

/**
 * Update challan status to paid
 * @param challanId Challan ID
 * @returns Promise that resolves when update is complete
 */
export const payChallan = async (challanId: string): Promise<void> => {
  try {
    const challanRef = doc(firestore, 'challans', challanId);

    await updateDoc(challanRef, {
      status: 'paid',
      paidAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error paying challan:', error);
    throw error;
  }
};

/**
 * Calculate challan amount based on vehicle type and violation
 * @param vehicleType Type of vehicle
 * @param violationType Type of violation
 * @returns Calculated challan amount
 */
export const getChallanAmount = (violationType: ViolationType, vehicleType: VehicleType): number => {
  const violationAmount = challanData.violationTypes[violationType].amount;
  const vehicleBaseAmount = challanData.vehicleTypes[vehicleType].baseAmount;
  return violationAmount + vehicleBaseAmount;
};

export const getViolationDescription = (violationType: ViolationType): string => {
  return challanData.violationTypes[violationType].description;
};

export const getVehicleDescription = (vehicleType: VehicleType): string => {
  return challanData.vehicleTypes[vehicleType].description;
};

export const getAllViolationTypes = (): ViolationType[] => {
  return Object.keys(challanData.violationTypes) as ViolationType[];
};

export const getAllVehicleTypes = (): VehicleType[] => {
  return Object.keys(challanData.vehicleTypes) as VehicleType[];
};

/**
 * Add challans from a JSON file to Firestore
 * @param userId User ID to associate with the challans
 * @param filePath Path to the JSON file
 */
export const addChallansFromJSON = async (userId: string, filePath: string): Promise<void> => {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    for (const entry of data) {
      const challanData: Omit<Challan, 'id'> = {
        vehicleNumber: entry.vehicleNo,
        vehicleType: 'Car', // Default vehicle type
        violationType: 'No-Entry Zone Violation', // Default violation type
        location: 'Unknown', // Default location
        amount: entry.charge,
        status: entry.paid ? 'paid' : 'pending',
        userId,
        timestamp: Timestamp.fromDate(new Date(entry.time)),
      };

      await createChallan(challanData);
    }

    console.log('Challans added successfully from JSON file.');
  } catch (error) {
    console.error('Error adding challans from JSON file:', error);
    throw error;
  }
};

// Mock data for testing
export const mockChallans: Challan[] = [
  {
    id: '1',
    vehicleNumber: 'AB 123 CD',
    location: 'Main Street',
    timestamp: Timestamp.fromDate(new Date()),
    amount: 1500,
    status: 'pending',
    vehicleType: 'car',
    violationType: 'speeding',
    userId: 'user123',
  },
  {
    id: '2',
    vehicleNumber: 'XY 456 ZW',
    location: 'Highway Road',
    timestamp: Timestamp.fromDate(new Date()),
    amount: 2000,
    status: 'paid',
    vehicleType: 'truck',
    violationType: 'redLight',
    userId: 'user123',
    paidAt: Timestamp.fromDate(new Date()),
    paymentMethod: 'card',
  },
];