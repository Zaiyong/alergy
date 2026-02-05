import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';

/**
 * Image Utility Service
 * 
 * Provides image processing functions including resizing
 * to optimize images before sending to AI analysis.
 */

// Maximum dimensions for resized images (keeping aspect ratio)
const MAX_IMAGE_DIMENSION = 1024; // Max width or height in pixels
const IMAGE_QUALITY = 0.8; // JPEG quality (0-1)

/**
 * Resize and compress an image for optimal API processing
 * 
 * This function:
 * 1. Resizes the image to a maximum dimension while maintaining aspect ratio
 * 2. Compresses to JPEG format with specified quality
 * 3. Returns the URI to the processed image
 * 
 * @param imageUri - The original image URI
 * @param maxDimension - Maximum width or height (default: 1024)
 * @param quality - JPEG compression quality 0-1 (default: 0.8)
 * @returns Object with URI and base64 of the resized image
 */
export const resizeImageForAnalysis = async (
  imageUri: string,
  maxDimension: number = MAX_IMAGE_DIMENSION,
  quality: number = IMAGE_QUALITY
): Promise<{ uri: string; base64: string; width: number; height: number }> => {
  try {
    // Use expo-image-manipulator to resize the image
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          // Resize to fit within maxDimension x maxDimension while maintaining aspect ratio
          resize: {
            width: maxDimension,
            // Height is auto-calculated to maintain aspect ratio
          },
        },
      ],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      }
    );

    // If the result height is still too large, resize again by height
    if (result.height > maxDimension) {
      const heightResult = await ImageManipulator.manipulateAsync(
        result.uri,
        [
          {
            resize: {
              height: maxDimension,
            },
          },
        ],
        {
          compress: quality,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      return {
        uri: heightResult.uri,
        base64: heightResult.base64 || '',
        width: heightResult.width,
        height: heightResult.height,
      };
    }

    return {
      uri: result.uri,
      base64: result.base64 || '',
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    // Log the error for debugging
    console.error('[imageUtils] Failed to resize image:', error);
    
    // Rethrow with more context
    throw new Error(
      `Failed to resize image: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Calculate the estimated base64 size in bytes
 * Base64 encoding increases size by approximately 4/3
 * 
 * @param base64String - The base64 encoded string
 * @returns Estimated size in bytes
 */
export const getBase64SizeBytes = (base64String: string): number => {
  // Remove any data URI prefix
  const cleanBase64 = base64String.replace(/^data:.*,/, '');
  // Calculate approximate byte size (base64 is ~4/3 of original)
  return Math.ceil(cleanBase64.length * 0.75);
};

/**
 * Format file size for display
 * 
 * @param bytes - Size in bytes
 * @returns Human-readable size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
};
