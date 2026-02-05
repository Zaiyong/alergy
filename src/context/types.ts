import { AllergenId } from '../constants/allergens';

/**
 * User's allergy profile - stored locally on device only (privacy-first)
 */
export interface AllergyProfile {
  selectedAllergenIds: AllergenId[];
}

/**
 * Storage key for AsyncStorage
 */
export const ALLERGY_PROFILE_STORAGE_KEY = '@yumsafe:allergy_profile';
