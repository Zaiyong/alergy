import React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useAllergyProfile } from '../context/AllergyProfileContext';
import { EU_ALLERGENS, AllergenId } from '../constants/allergens';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnimatedButton } from '../components/AnimatedButton';

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
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#FFF8F0' }}>
        <ActivityIndicator size="large" color="#FF4D2D" />
        <Text className="mt-4 text-gray-700 font-semibold">Loading your allergy profile...</Text>
      </View>
    );
  }

  const handleContinue = () => {
    navigation.navigate('Scanner');
  };

  return (
    <View className="flex-1" style={{ backgroundColor: '#FFF8F0' }}>
      <ScrollView className="flex-1 px-4 pt-12">
        <Text className="text-4xl font-bold mb-2" style={{ color: '#FF4D2D' }}>
          Allergy Setup
        </Text>
        <Text className="text-base mb-6" style={{ color: '#666' }}>
          Select the allergens you need to avoid. This information stays on your device only.
        </Text>

        <View className="space-y-2">
          {EU_ALLERGENS.map((allergen) => {
            const isSelected = selectedAllergenIds.includes(allergen.id);
            return (
              <AnimatedButton
                key={allergen.id}
                onPress={() => toggleAllergen(allergen.id)}
                className={`flex-row items-center p-4 mb-3 rounded-doughy border-2 ${
                  isSelected
                    ? 'border-tomato-red'
                    : 'border-gray-300'
                }`}
                style={{
                  backgroundColor: isSelected ? '#FF4D2D' : '#FFFFFF',
                }}
                accessibilityLabel={`Toggle ${allergen.label.en}`}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
              >
                <View
                  className={`w-7 h-7 rounded-full border-2 mr-3 items-center justify-center ${
                    isSelected
                      ? 'bg-white border-white'
                      : 'bg-white border-gray-400'
                  }`}
                >
                  {isSelected && (
                    <Text className="text-tomato-red text-sm font-bold">✓</Text>
                  )}
                </View>
                <Text
                  className={`flex-1 text-base font-semibold ${
                    isSelected ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  {allergen.label.en}
                </Text>
              </AnimatedButton>
            );
          })}
        </View>

        <View className="h-8" />
      </ScrollView>

      <View className="px-4 pb-8 pt-4" style={{ backgroundColor: '#FFF8F0', borderTopWidth: 1, borderTopColor: '#FFE5E0' }}>
        <AnimatedButton
          onPress={handleContinue}
          className="py-5 rounded-doughy-lg items-center"
          style={{ backgroundColor: '#FF4D2D' }}
          accessibilityLabel="Continue to scanner"
          accessibilityRole="button"
        >
          <Text className="text-white text-xl font-bold">
            Continue to Scanner
          </Text>
        </AnimatedButton>
        {selectedAllergenIds.length === 0 && (
          <Text className="text-center text-sm mt-3" style={{ color: '#999' }}>
            You can skip this step and scan anyway
          </Text>
        )}
      </View>
    </View>
  );
};
