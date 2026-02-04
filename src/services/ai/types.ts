/**
 * Types for Gemini AI service
 */

/**
 * Analysis result status - maps to traffic light system (Phase 2)
 */
export type AnalysisStatus = 'safe' | 'caution' | 'unsafe';

/**
 * Result from Gemini AI analysis
 */
export interface AnalysisResult {
  status: AnalysisStatus;
  allergens: string[]; // List of detected allergens that match user's profile
  pal: string[]; // Precautionary Allergen Labelling ("May contain" warnings)
  explanation: string; // Human-readable explanation
}

/**
 * Custom error types for better error handling
 */
export class AnalysisError extends Error {
  constructor(
    message: string,
    public code: 'BLURRY_IMAGE' | 'NO_INGREDIENTS' | 'API_TIMEOUT' | 'API_ERROR' | 'INVALID_IMAGE' | 'UNKNOWN'
  ) {
    super(message);
    this.name = 'AnalysisError';
  }
}
