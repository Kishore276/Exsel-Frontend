// This file contains utility functions for vehicle detection using OpenCV.js

/**
 * Initialize OpenCV.js
 * @returns Promise that resolves when OpenCV is ready
 */
export const initOpenCV = (): Promise<void> => {
  return new Promise((resolve) => {
    if (window.cv) {
      resolve();
      return;
    }

    // Set up a one-time event listener for OpenCV ready
    const onReadyHandler = () => {
      resolve();
      document.removeEventListener('opencv-ready', onReadyHandler);
    };
    
    document.addEventListener('opencv-ready', onReadyHandler);
  });
};

/**
 * Detect vehicles in an image
 * @param imageElement HTML image or canvas element containing the image
 * @returns Array of detected vehicles with their bounding boxes
 */
export const detectVehicles = async (imageElement: HTMLImageElement | HTMLCanvasElement) => {
  // Ensure OpenCV is initialized
  await initOpenCV();
  
  const cv = window.cv;
  
  // Create OpenCV mat from image
  const src = cv.imread(imageElement);
  
  // Convert to grayscale for better detection
  const gray = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  
  // Apply Gaussian blur to reduce noise
  const blurred = new cv.Mat();
  const ksize = new cv.Size(5, 5);
  cv.GaussianBlur(gray, blurred, ksize, 0);
  
  // Apply Canny edge detection
  const edges = new cv.Mat();
  cv.Canny(blurred, edges, 50, 150);
  
  // Find contours
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  
  // Filter contours to find potential vehicles
  const vehicles = [];
  for (let i = 0; i < contours.size(); ++i) {
    const contour = contours.get(i);
    const area = cv.contourArea(contour);
    
    // Filter by area to remove small noise
    if (area > 1000) {
      const rect = cv.boundingRect(contour);
      
      // Filter by aspect ratio to find vehicle-like shapes
      const aspectRatio = rect.width / rect.height;
      if (aspectRatio > 0.5 && aspectRatio < 2.5) {
        vehicles.push({
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          area: area
        });
      }
    }
    
    contour.delete();
  }
  
  // Clean up
  src.delete();
  gray.delete();
  blurred.delete();
  edges.delete();
  contours.delete();
  hierarchy.delete();
  
  return vehicles;
};

/**
 * Extract license plate text from an image
 * @param imageElement HTML image or canvas element containing the image
 * @param region Region of interest (x, y, width, height)
 * @returns Detected license plate text
 */
export const extractLicensePlate = async (
  imageElement: HTMLImageElement | HTMLCanvasElement,
  region: { x: number; y: number; width: number; height: number }
) => {
  // Ensure OpenCV is initialized
  await initOpenCV();
  
  const cv = window.cv;
  
  // Create OpenCV mat from image
  const src = cv.imread(imageElement);
  
  // Extract region of interest
  const roi = src.roi(new cv.Rect(region.x, region.y, region.width, region.height));
  
  // Convert to grayscale
  const gray = new cv.Mat();
  cv.cvtColor(roi, gray, cv.COLOR_RGBA2GRAY);
  
  // Apply threshold to get binary image
  const binary = new cv.Mat();
  cv.threshold(gray, binary, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
  
  // In a real implementation, we would use OCR here
  // For this demo, we'll return a placeholder
  
  // Clean up
  src.delete();
  roi.delete();
  gray.delete();
  binary.delete();
  
  // In a real implementation, this would be the result of OCR
  return "AB 12 CD 345";
};

/**
 * Calculate vehicle dimensions based on camera calibration and distance
 * @param boundingBox Bounding box of the vehicle (x, y, width, height)
 * @param cameraParams Camera calibration parameters
 * @returns Estimated vehicle dimensions (width, height, length)
 */
export const calculateVehicleDimensions = (
  boundingBox: { width: number; height: number },
  cameraParams: { focalLength: number; sensorWidth: number; distance: number }
) => {
  // Calculate real-world width using similar triangles
  const realWidth = (boundingBox.width * cameraParams.distance) / cameraParams.focalLength;
  
  // Calculate real-world height using similar triangles
  const realHeight = (boundingBox.height * cameraParams.distance) / cameraParams.focalLength;
  
  // Estimate length based on vehicle type (this would be more sophisticated in a real implementation)
  const estimatedLength = realWidth * 2.5;
  
  return {
    width: realWidth,
    height: realHeight,
    length: estimatedLength
  };
};

/**
 * Classify vehicle type based on dimensions
 * @param dimensions Vehicle dimensions (width, height, length)
 * @returns Vehicle type classification
 */
export const classifyVehicleType = (dimensions: { width: number; height: number; length: number }) => {
  const { width, height, length } = dimensions;
  
  if (width < 1.3 && length < 2.5) {
    return 'Motorcycle';
  } else if (width < 2.0 && height < 1.8 && length < 5.0) {
    return 'Car';
  } else if (width < 2.3 && height < 2.5 && length < 6.0) {
    return 'Van';
  } else if (width < 2.6 && height < 3.5 && length < 12.0) {
    return 'Bus';
  } else {
    return 'Truck';
  }
};

// Add OpenCV type definitions to the Window interface
declare global {
  interface Window {
    cv: any;
    onOpenCVReady: () => void;
  }
}