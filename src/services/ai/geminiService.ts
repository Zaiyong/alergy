import { GoogleGenerativeAI } from '@google/generative-ai';
import { AllergenId } from '../../constants/allergens';
import { getAllergenLabel } from '../../constants/allergens';
import { AnalysisResult, AnalysisStatus, AnalysisError } from './types';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Gemini AI Service Configuration
 * 
 * Modular configuration - easy to swap models or update prompts without touching core logic.
 * Using @google/generative-ai (legacy SDK) for React Native compatibility.
 * Note: Can be migrated to @google/genai (new SDK) in the future if needed.
 */

// Model configuration
// Updated to gemini-2.0-flash (gemini-1.5-flash was deprecated)
const GEMINI_MODEL_NAME = 'gemini-2.0-flash';
const API_TIMEOUT_MS = 30000; // 30 seconds timeout

// Maximum image size for Gemini API (7 MB as per Gemini 1.5 Flash specs)
const MAX_IMAGE_SIZE_BYTES = 7 * 1024 * 1024;

/**
 * System instruction for YumSafe
 * 
 * This defines the AI's behavior:
 * - Analyzes ingredient labels in EN, DE, FR, ES
 * - Aligns with EU Regulation 1169/2011 (Annex II)
 * - Detects bolded allergen names and "May contain" / PAL phrases
 * - Returns structured output for traffic light system
 */
const SYSTEM_INSTRUCTION = `You are YumSafe, an AI assistant that analyzes food ingredient labels for allergen detection according to EU Regulation 1169/2011 (Annex II).

Your task:
1. Analyze the ingredient label image provided (may be in English, German, French, or Spanish).
2. Identify all allergens from the EU's 14 mandatory allergen list that are present in the ingredients.
3. Pay special attention to:
   - Bolded allergen names (common labeling requirement)
   - "May contain" statements (Precautionary Allergen Labelling / PAL)
   - Allergen names in all supported languages (EN, DE, FR, ES)
4. Compare detected allergens against the user's allergy profile.
5. Return a JSON response with this exact structure:
{
  "status": "safe" | "caution" | "unsafe",
  "allergens": ["list", "of", "detected", "allergens", "matching", "user", "profile"],
  "pal": ["list", "of", "may", "contain", "warnings", "relevant", "to", "user"],
  "explanation": "Clear explanation in English of the analysis result"
}

Status rules:
- "unsafe": One or more allergens from user's profile are directly listed in ingredients
- "caution": No direct allergens, but "May contain" warnings exist for user's allergens
- "safe": No allergens from user's profile detected, no relevant PAL warnings

Be thorough and accurate. If the image is blurry or no ingredients are visible, indicate this clearly.`;

/**
 * Initialize Gemini client
 * 
 * Reads API key from environment variable EXPO_PUBLIC_GEMINI_API_KEY
 */
const getGeminiClient = (): GoogleGenerativeAI => {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('EXPO_PUBLIC_GEMINI_API_KEY is not set. Please add it to your .env file.');
  }
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Convert image URI to base64 string
 * 
 * This function reads an image file and converts it to base64 format
 * required by the Gemini API. Used when expo-camera returns a file URI.
 * 
 * @param uri - File URI from expo-camera or file system
 * @returns Base64 string (without data URI prefix)
 */
const imageUriToBase64 = async (uri: string): Promise<string> => {
  try {
    // Read file as base64 using expo-file-system
    // This is specifically for Gemini API image input
    // Use string literal 'base64' as EncodingType may be undefined in some versions
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });

    // Check file size
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.exists && fileInfo.size && fileInfo.size > MAX_IMAGE_SIZE_BYTES) {
      throw new AnalysisError(
        `Image size (${fileInfo.size} bytes) exceeds maximum allowed size (${MAX_IMAGE_SIZE_BYTES} bytes)`,
        'INVALID_IMAGE'
      );
    }

    return base64;
  } catch (error) {
    if (error instanceof AnalysisError) {
      throw error;
    }
    throw new AnalysisError(
      `Failed to read image file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'INVALID_IMAGE'
    );
  }
};

/**
 * Parse Gemini API response to structured AnalysisResult
 * 
 * Handles JSON parsing and error mapping from API responses
 */
const parseGeminiResponse = (responseText: string): AnalysisResult => {
  try {
    // Try to extract JSON from response (may have markdown code blocks)
    let jsonText = responseText.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonText);

    // Validate structure
    if (!parsed.status || !['safe', 'caution', 'unsafe'].includes(parsed.status)) {
      throw new Error('Invalid status in response');
    }

    return {
      status: parsed.status as AnalysisStatus,
      allergens: Array.isArray(parsed.allergens) ? parsed.allergens : [],
      pal: Array.isArray(parsed.pal) ? parsed.pal : [],
      explanation: parsed.explanation || 'No explanation provided',
    };
  } catch (error) {
    // If JSON parsing fails, try to detect common error patterns
    const lowerText = responseText.toLowerCase();
    
    if (lowerText.includes('blurry') || lowerText.includes('unclear') || lowerText.includes('cannot read')) {
      throw new AnalysisError('Image is too blurry to read ingredients', 'BLURRY_IMAGE');
    }
    
    if (lowerText.includes('no ingredients') || lowerText.includes('ingredients not found')) {
      throw new AnalysisError('No ingredients found in the image', 'NO_INGREDIENTS');
    }

    // Fallback: return a safe result with explanation
    return {
      status: 'caution',
      allergens: [],
      pal: [],
      explanation: `Could not parse AI response. Raw response: ${responseText.substring(0, 200)}`,
    };
  }
};

/**
 * Analyze food ingredient label using Gemini AI
 * 
 * Main service function that:
 * 1. Converts image to base64 if needed
 * 2. Builds prompt with user allergy profile
 * 3. Calls Gemini API with timeout handling
 * 4. Parses and returns structured result
 * 
 * @param imageInput - Image as base64 string or file URI
 * @param userAllergenIds - Array of allergen IDs from user's profile
 * @returns AnalysisResult with status, allergens, PAL, and explanation
 * @throws AnalysisError for various error conditions
 */
export const analyzeLabel = async (
  imageInput: string,
  userAllergenIds: AllergenId[]
): Promise<AnalysisResult> => {
  try {
    // Step 1: Convert image to base64 if it's a URI
    let imageBase64: string;
    let mimeType = 'image/jpeg'; // Default, will be detected if possible

    if (imageInput.startsWith('data:')) {
      // Already base64 with data URI prefix
      const match = imageInput.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        imageBase64 = match[2];
      } else {
        // Just base64 without prefix
        imageBase64 = imageInput.replace(/^data:.*,/, '');
      }
    } else if (imageInput.startsWith('file://') || imageInput.startsWith('/')) {
      // File URI - convert to base64
      imageBase64 = await imageUriToBase64(imageInput);
      // Try to detect mime type from file extension
      if (imageInput.toLowerCase().endsWith('.png')) {
        mimeType = 'image/png';
      }
    } else {
      // Assume it's already base64 without prefix
      imageBase64 = imageInput;
    }

    // Step 2: Build user allergy profile text for prompt
    const userAllergenLabels = userAllergenIds.map((id) => getAllergenLabel(id));
    const userProfileText = userAllergenLabels.length > 0
      ? `User's allergy profile: ${userAllergenLabels.join(', ')}`
      : 'User has no selected allergens (scanning for all allergens)';

    // Step 3: Initialize Gemini client and model
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ 
      model: GEMINI_MODEL_NAME,
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    // Step 4: Prepare image part for multimodal input
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType,
      },
    };

    // Step 5: Build prompt with user profile
    const prompt = `${userProfileText}\n\nAnalyze this ingredient label image and determine if it's safe for the user based on their allergy profile.`;

    // Step 6: Call Gemini API with timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new AnalysisError('API request timed out', 'API_TIMEOUT'));
      }, API_TIMEOUT_MS);
    });

    const apiPromise = model.generateContent([prompt, imagePart]);
    const response = await Promise.race([apiPromise, timeoutPromise]);

    // Step 7: Extract and parse response
    const responseText = response.response.text();
    return parseGeminiResponse(responseText);

  } catch (error) {
    // Map various errors to AnalysisError
    if (error instanceof AnalysisError) {
      throw error;
    }

    if (error instanceof Error) {
      // Check for API key errors (most common issue)
      if (error.message.includes('EXPO_PUBLIC_GEMINI_API_KEY') || error.message.includes('API key') || error.message.includes('apiKey')) {
        throw new AnalysisError(`API key not configured: ${error.message}. Please add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.`, 'API_ERROR');
      }
      
      // Check for timeout or network errors
      if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
        throw new AnalysisError('API request timed out', 'API_TIMEOUT');
      }
      
      // Check for rate limit errors (429)
      if (error.message.includes('429') || error.message.includes('Resource exhausted') || error.message.includes('rate limit') || error.message.includes('quota')) {
        throw new AnalysisError('API rate limit exceeded. Please wait a moment and try again.', 'API_ERROR');
      }
      
      // Check for API errors
      if (error.message.includes('API') || error.message.includes('401') || error.message.includes('403')) {
        throw new AnalysisError(`API error: ${error.message}`, 'API_ERROR');
      }

      // Check for image-related errors
      if (error.message.includes('image') || error.message.includes('blurry') || error.message.includes('read')) {
        throw new AnalysisError(`Image error: ${error.message}`, 'BLURRY_IMAGE');
      }
    }

    // Unknown error
    throw new AnalysisError(
      `Unknown error during analysis: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'UNKNOWN'
    );
  }
};
