import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalysisResult } from '../services/ai/types';

type RootStackParamList = {
  AllergySetup: undefined;
  Scanner: undefined;
  Result: { result: AnalysisResult | unknown };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

/**
 * Placeholder Result Screen (Phase 1)
 * 
 * Phase 2 will implement:
 * - Traffic light UI (Red/Yellow/Green)
 * - Beautiful result cards
 * - Detailed explanations
 * - Multilingual support
 */
export const ResultScreen: React.FC<Props> = ({ route, navigation }) => {
  const { result } = route.params;

  // Type guard for AnalysisResult
  const isAnalysisResult = (r: unknown): r is AnalysisResult => {
    return (
      typeof r === 'object' &&
      r !== null &&
      'status' in r &&
      'allergens' in r &&
      'pal' in r &&
      'explanation' in r
    );
  };

  const analysisResult = isAnalysisResult(result) ? result : null;

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 px-4 pt-12">
        <Text className="text-3xl font-bold text-gray-900 mb-4">
          Analysis Result
        </Text>

        {analysisResult ? (
          <View className="space-y-4">
            {/* Status */}
            <View className="bg-gray-50 p-4 rounded-lg">
              <Text className="text-sm text-gray-600 mb-1">Status</Text>
              <Text className="text-2xl font-bold text-gray-900 capitalize">
                {analysisResult.status}
              </Text>
            </View>

            {/* Detected Allergens */}
            {analysisResult.allergens.length > 0 && (
              <View className="bg-red-50 p-4 rounded-lg border border-red-200">
                <Text className="text-sm font-semibold text-red-900 mb-2">
                  Detected Allergens
                </Text>
                {analysisResult.allergens.map((allergen, index) => (
                  <Text key={index} className="text-red-800">
                    • {allergen}
                  </Text>
                ))}
              </View>
            )}

            {/* Precautionary Allergen Labelling */}
            {analysisResult.pal.length > 0 && (
              <View className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <Text className="text-sm font-semibold text-yellow-900 mb-2">
                  May Contain Warnings
                </Text>
                {analysisResult.pal.map((warning, index) => (
                  <Text key={index} className="text-yellow-800">
                    • {warning}
                  </Text>
                ))}
              </View>
            )}

            {/* Explanation */}
            <View className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <Text className="text-sm font-semibold text-blue-900 mb-2">
                Explanation
              </Text>
              <Text className="text-blue-800">{analysisResult.explanation}</Text>
            </View>
          </View>
        ) : (
          <View className="bg-gray-50 p-4 rounded-lg">
            <Text className="text-gray-700">
              Raw result data (Phase 2 will have proper UI):
            </Text>
            <Text className="text-gray-600 mt-2 font-mono text-xs">
              {JSON.stringify(result, null, 2)}
            </Text>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>

      <View className="px-4 pb-8 pt-4 bg-white border-t border-gray-200">
        <TouchableOpacity
          onPress={() => navigation.navigate('Scanner')}
          className="bg-blue-500 py-4 rounded-lg items-center"
        >
          <Text className="text-white text-lg font-semibold">Scan Another Label</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
