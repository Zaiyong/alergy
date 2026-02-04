import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useAllergyProfile } from '../context/AllergyProfileContext';
import { EU_ALLERGENS, AllergenId } from '../constants/allergens';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  AllergySetup: undefined;
  Scanner: undefined;
  Result: { result: unknown };
};

type Props = NativeStackScreenProps<RootStackParamList, 'AllergySetup'>;

export const AllergySetupScreen: React.FC<Props> = ({ navigation }) => {
  const { selectedAllergenIds, toggleAllergen, isLoading } = useAllergyProfile();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600">Loading your allergy profile...</Text>
      </View>
    );
  }

  const handleContinue = () => {
    navigation.navigate('Scanner');
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 px-4 pt-12">
        <Text className="text-3xl font-bold text-gray-900 mb-2">
          Allergy Setup
        </Text>
        <Text className="text-base text-gray-600 mb-6">
          Select the allergens you need to avoid. This information stays on your device only.
        </Text>

        <View className="space-y-2">
          {EU_ALLERGENS.map((allergen) => {
            const isSelected = selectedAllergenIds.includes(allergen.id);
            return (
              <TouchableOpacity
                key={allergen.id}
                onPress={() => toggleAllergen(allergen.id)}
                className={`flex-row items-center p-4 mb-2 rounded-lg border-2 ${
                  isSelected
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-gray-50 border-gray-200'
                }`}
                accessibilityLabel={`Toggle ${allergen.label.en}`}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
              >
                <View
                  className={`w-6 h-6 rounded border-2 mr-3 items-center justify-center ${
                    isSelected
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-white border-gray-400'
                  }`}
                >
                  {isSelected && (
                    <Text className="text-white text-xs font-bold">✓</Text>
                  )}
                </View>
                <Text
                  className={`flex-1 text-base ${
                    isSelected ? 'text-gray-900 font-medium' : 'text-gray-700'
                  }`}
                >
                  {allergen.label.en}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View className="h-8" />
      </ScrollView>

      <View className="px-4 pb-8 pt-4 bg-white border-t border-gray-200">
        <TouchableOpacity
          onPress={handleContinue}
          className="bg-blue-500 py-4 rounded-lg items-center"
          accessibilityLabel="Continue to scanner"
          accessibilityRole="button"
        >
          <Text className="text-white text-lg font-semibold">
            Continue to Scanner
          </Text>
        </TouchableOpacity>
        {selectedAllergenIds.length === 0 && (
          <Text className="text-center text-gray-500 text-sm mt-2">
            You can skip this step and scan anyway
          </Text>
        )}
      </View>
    </View>
  );
};
