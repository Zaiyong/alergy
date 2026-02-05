import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalysisResult } from '../services/ai/types';
import { AnimatedButton } from '../components/AnimatedButton';

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

  // Determine status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unsafe':
        return { bg: '#FF4D2D', text: '#FFFFFF', border: '#FF4D2D' };
      case 'caution':
        return { bg: '#FFC30B', text: '#000000', border: '#FFC30B' };
      case 'safe':
        return { bg: '#4CAF50', text: '#FFFFFF', border: '#4CAF50' };
      default:
        return { bg: '#FFF8F0', text: '#333', border: '#DDD' };
    }
  };

  const statusColors = analysisResult ? getStatusColor(analysisResult.status) : null;

  return (
    <View className="flex-1" style={{ backgroundColor: '#FFF8F0' }}>
      <ScrollView className="flex-1 px-4 pt-12">
        <Text className="text-4xl font-bold mb-4" style={{ color: '#FF4D2D' }}>
          Analysis Result
        </Text>

        {analysisResult ? (
          <View className="space-y-4">
            {/* Status */}
            <View className="p-5 rounded-doughy border-2" style={{ 
              backgroundColor: statusColors?.bg || '#FFF8F0',
              borderColor: statusColors?.border || '#DDD',
            }}>
              <Text className="text-sm mb-2 font-semibold" style={{ color: statusColors?.text || '#666' }}>
                Status
              </Text>
              <Text className="text-3xl font-bold capitalize" style={{ color: statusColors?.text || '#333' }}>
                {analysisResult.status}
              </Text>
            </View>

            {/* Detected Allergens */}
            {analysisResult.allergens.length > 0 && (
              <View className="p-5 rounded-doughy border-2" style={{ 
                backgroundColor: '#FFFFFF',
                borderColor: '#FF4D2D',
              }}>
                <Text className="text-base font-bold mb-3" style={{ color: '#FF4D2D' }}>
                  ⚠️ Detected Allergens
                </Text>
                {analysisResult.allergens.map((allergen, index) => (
                  <Text key={index} className="text-base mb-1" style={{ color: '#FF4D2D' }}>
                    • {allergen}
                  </Text>
                ))}
              </View>
            )}

            {/* Precautionary Allergen Labelling */}
            {analysisResult.pal.length > 0 && (
              <View className="p-5 rounded-doughy border-2" style={{ 
                backgroundColor: '#FFFFFF',
                borderColor: '#FFC30B',
              }}>
                <Text className="text-base font-bold mb-3" style={{ color: '#FFC30B' }}>
                  ⚠️ May Contain Warnings
                </Text>
                {analysisResult.pal.map((warning, index) => (
                  <Text key={index} className="text-base mb-1" style={{ color: '#CC9900' }}>
                    • {warning}
                  </Text>
                ))}
              </View>
            )}

            {/* Explanation */}
            <View className="p-5 rounded-doughy border-2" style={{ 
              backgroundColor: '#FFFFFF',
              borderColor: '#DDD',
            }}>
              <Text className="text-base font-bold mb-3" style={{ color: '#333' }}>
                📋 Explanation
              </Text>
              <Text className="text-base leading-6" style={{ color: '#666' }}>
                {analysisResult.explanation}
              </Text>
            </View>
          </View>
        ) : (
          <View className="p-5 rounded-doughy" style={{ backgroundColor: '#FFFFFF' }}>
            <Text className="text-gray-700 font-semibold">
              Raw result data (Phase 2 will have proper UI):
            </Text>
            <Text className="text-gray-600 mt-2 font-mono text-xs">
              {JSON.stringify(result, null, 2)}
            </Text>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>

      <View className="px-4 pb-8 pt-4" style={{ backgroundColor: '#FFF8F0', borderTopWidth: 1, borderTopColor: '#FFE5E0' }}>
        <AnimatedButton
          onPress={() => navigation.navigate('Scanner')}
          className="py-5 rounded-doughy-lg items-center"
          style={{ backgroundColor: '#FF4D2D' }}
          accessibilityLabel="Scan another label"
          accessibilityRole="button"
        >
          <Text className="text-white text-xl font-bold">Scan Another Label</Text>
        </AnimatedButton>
      </View>
    </View>
  );
};
