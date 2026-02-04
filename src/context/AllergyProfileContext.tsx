import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AllergenId } from '../constants/allergens';
import { AllergyProfile, ALLERGY_PROFILE_STORAGE_KEY } from './types';

interface AllergyProfileContextType {
  selectedAllergenIds: AllergenId[];
  setSelectedAllergenIds: (ids: AllergenId[]) => void;
  toggleAllergen: (id: AllergenId) => void;
  loadProfile: () => Promise<void>;
  saveProfile: () => Promise<void>;
  isLoading: boolean;
}

const AllergyProfileContext = createContext<AllergyProfileContextType | undefined>(undefined);

interface AllergyProfileProviderProps {
  children: ReactNode;
}

export const AllergyProfileProvider: React.FC<AllergyProfileProviderProps> = ({ children }) => {
  const [selectedAllergenIds, setSelectedAllergenIdsState] = useState<AllergenId[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load allergy profile from AsyncStorage on app start
   */
  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem(ALLERGY_PROFILE_STORAGE_KEY);
      if (stored) {
        const profile: AllergyProfile = JSON.parse(stored);
        setSelectedAllergenIdsState(profile.selectedAllergenIds || []);
      }
    } catch (error) {
      console.error('Failed to load allergy profile:', error);
      // On error, default to empty array
      setSelectedAllergenIdsState([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Save allergy profile to AsyncStorage (privacy-first: local storage only)
   */
  const saveProfile = useCallback(async () => {
    try {
      const profile: AllergyProfile = {
        selectedAllergenIds: selectedAllergenIds,
      };
      await AsyncStorage.setItem(ALLERGY_PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.error('Failed to save allergy profile:', error);
      throw error;
    }
  }, [selectedAllergenIds]);

  /**
   * Set selected allergen IDs and auto-save
   */
  const setSelectedAllergenIds = useCallback((ids: AllergenId[]) => {
    setSelectedAllergenIdsState(ids);
    // Auto-save after state update
    const profile: AllergyProfile = { selectedAllergenIds: ids };
    AsyncStorage.setItem(ALLERGY_PROFILE_STORAGE_KEY, JSON.stringify(profile)).catch((error) => {
      console.error('Failed to auto-save allergy profile:', error);
    });
  }, []);

  /**
   * Toggle an allergen in the selection
   */
  const toggleAllergen = useCallback((id: AllergenId) => {
    setSelectedAllergenIdsState((prev) => {
      const newIds = prev.includes(id)
        ? prev.filter((allergenId) => allergenId !== id)
        : [...prev, id];
      
      // Auto-save after toggle
      const profile: AllergyProfile = { selectedAllergenIds: newIds };
      AsyncStorage.setItem(ALLERGY_PROFILE_STORAGE_KEY, JSON.stringify(profile)).catch((error) => {
        console.error('Failed to auto-save allergy profile:', error);
      });
      
      return newIds;
    });
  }, []);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const value: AllergyProfileContextType = {
    selectedAllergenIds,
    setSelectedAllergenIds,
    toggleAllergen,
    loadProfile,
    saveProfile,
    isLoading,
  };

  return (
    <AllergyProfileContext.Provider value={value}>
      {children}
    </AllergyProfileContext.Provider>
  );
};

/**
 * Hook to use allergy profile context
 */
export const useAllergyProfile = (): AllergyProfileContextType => {
  const context = useContext(AllergyProfileContext);
  if (context === undefined) {
    throw new Error('useAllergyProfile must be used within an AllergyProfileProvider');
  }
  return context;
};
