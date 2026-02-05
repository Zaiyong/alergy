import React, { useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAllergyProfile } from '../context/AllergyProfileContext';
import { EU_ALLERGENS, AllergenId, getAllergenIcon } from '../constants/allergens';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnimatedButton } from '../components/AnimatedButton';

type RootStackParamList = {
  Welcome: undefined;
  AllergySetup: undefined;
  Scanner: undefined;
  Result: { result: unknown };
};

type Props = NativeStackScreenProps<RootStackParamList, 'AllergySetup'>;

export const AllergySetupScreen: React.FC<Props> = ({ navigation }) => {
  const { selectedAllergenIds, toggleAllergen, isLoading } = useAllergyProfile();
  
  // Calculate card dimensions for uniform 2-column grid
  const { cardWidth, gap } = useMemo(() => {
    const screenWidth = Dimensions.get('window').width;
    const padding = 32; // 16px on each side (px-4 = 16px)
    const gapSize = 12;
    const halfCardWidth = (screenWidth - padding - gapSize) / 2;
    
    return {
      cardWidth: halfCardWidth,
      gap: gapSize,
    };
  }, []);

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

        <View 
          className="flex-row flex-wrap"
          style={{ gap }}
        >
          {EU_ALLERGENS.map((allergen) => {
            const isSelected = selectedAllergenIds.includes(allergen.id);
            
            return (
              <AnimatedButton
                key={allergen.id}
                onPress={() => toggleAllergen(allergen.id)}
                className={`rounded-doughy border-2 ${
                  isSelected
                    ? 'border-tomato-red'
                    : 'border-gray-300'
                }`}
                style={{
                  backgroundColor: isSelected ? '#FF4D2D' : '#FFFFFF',
                  width: cardWidth,
                  minHeight: 100,
                  padding: 16,
                  position: 'relative',
                }}
                accessibilityLabel={`Toggle ${allergen.label.en}`}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
              >
                {/* Checkmark indicator in top-right corner */}
                {isSelected && (
                  <View
                    className="absolute top-2 right-2 w-6 h-6 rounded-full items-center justify-center"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                  >
                    <Text className="text-tomato-red text-xs font-bold">✓</Text>
                  </View>
                )}
                
                {/* Vertical layout: icon on top, text below */}
                <View className="flex-1 items-center justify-center">
                  <MaterialIcons
                    name={getAllergenIcon(allergen.id) as any}
                    size={28}
                    color={isSelected ? '#FFFFFF' : '#FF4D2D'}
                    style={{ marginBottom: 8 }}
                  />
                  <Text
                    className={`text-center text-sm font-semibold ${
                      isSelected ? 'text-white' : 'text-gray-800'
                    }`}
                    numberOfLines={3}
                  >
                    {allergen.label.en}
                  </Text>
                </View>
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
