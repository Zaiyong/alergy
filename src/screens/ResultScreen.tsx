import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalysisResult } from '../services/ai/types';
import { AnimatedButton } from '../components/AnimatedButton';
import { AllergenTag } from '../components/AllergenTag';

type RootStackParamList = {
  Welcome: undefined;
  AllergySetup: undefined;
  Scanner: undefined;
  Result: { result: AnalysisResult | unknown };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

// Status configuration with soft backgrounds and high-contrast text
const statusConfig = {
  unsafe: {
    bg: '#FFF5F5',      // Soft red background
    iconColor: '#DC2626', // Dark red
    textColor: '#991B1B', // Dark red text
    icon: 'dangerous' as const,
    label: 'Unsafe',
  },
  caution: {
    bg: '#FFFBEB',      // Soft yellow background
    iconColor: '#D97706', // Dark orange
    textColor: '#92400E', // Dark orange text
    icon: 'warning' as const,
    label: 'Caution',
  },
  safe: {
    bg: '#F0FDF4',      // Soft green background
    iconColor: '#16A34A', // Green
    textColor: '#166534', // Dark green text
    icon: 'check-circle' as const,
    label: 'Safe',
  },
};

// Card shadow/elevation system
const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 3, // Android
};

/**
 * Parse explanation text to extract structured format
 * Looks for patterns like "Swedish → English" or "Swedish: English"
 */
const parseExplanation = (explanation: string): Array<{ swedish?: string; english: string; allergen?: string }> => {
  // Try to find Swedish → English pattern
  const arrowPattern = /([^→]+)→\s*([^→\n]+)/g;
  const colonPattern = /([^:]+):\s*([^:\n]+)/g;
  
  const results: Array<{ swedish?: string; english: string; allergen?: string }> = [];
  
  // Try arrow pattern first
  let match;
  while ((match = arrowPattern.exec(explanation)) !== null) {
    const swedish = match[1].trim();
    const english = match[2].trim();
    results.push({ swedish, english });
  }
  
  // If no arrow matches, try colon pattern
  if (results.length === 0) {
    while ((match = colonPattern.exec(explanation)) !== null) {
      const swedish = match[1].trim();
      const english = match[2].trim();
      results.push({ swedish, english });
    }
  }
  
  // If still no structured format found, split by sentences/paragraphs
  if (results.length === 0) {
    const sentences = explanation.split(/[.!?]\s+/).filter(s => s.trim().length > 0);
    sentences.forEach(sentence => {
      results.push({ english: sentence.trim() });
    });
  }
  
  return results;
};

/**
 * Highlight allergen names in text
 */
const highlightAllergens = (text: string, allergens: string[]): React.ReactNode => {
  if (allergens.length === 0) {
    // Return wrapped in Text component to prevent "Text strings must be rendered within a <Text> component" error
    return <Text style={{ color: '#666666' }}>{text}</Text>;
  }
  
  const allergenLower = allergens.map(a => a.toLowerCase());
  const words = text.split(/(\s+)/);
  
  return words.map((word, index) => {
    const wordLower = word.toLowerCase().replace(/[.,;:!?]/g, '');
    const isAllergen = allergenLower.some(allergen => 
      wordLower.includes(allergen) || allergen.includes(wordLower)
    );
    
    if (isAllergen) {
      return (
        <Text key={index} style={{ fontWeight: '700', color: '#DC2626' }}>
          {word}
        </Text>
      );
    }
    return <Text key={index}>{word}</Text>;
  });
};

export const ResultScreen: React.FC<Props> = ({ route, navigation }) => {
  const { result } = route.params;
  const insets = useSafeAreaInsets();

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
  const statusInfo = analysisResult ? statusConfig[analysisResult.status] : null;
  const parsedExplanation = analysisResult ? parseExplanation(analysisResult.explanation) : [];

  return (
    <View className="flex-1" style={{ backgroundColor: '#FFF8F0' }}>
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 32, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Screen Title */}
        <Text className="text-3xl font-bold mb-8" style={{ color: '#1A1A1A' }}>
          Analysis Result
        </Text>

        {analysisResult && statusInfo ? (
          <View style={{ gap: 24 }}>
            {/* Status Header - Elegant Warning Style */}
            <View
              style={[
                styles.statusHeader,
                {
                  backgroundColor: statusInfo.bg,
                  borderColor: statusInfo.iconColor + '20', // 20% opacity border
                },
                cardShadow,
              ]}
            >
              <View style={styles.statusHeaderContent}>
                <MaterialIcons
                  name={statusInfo.icon}
                  size={32}
                  color={statusInfo.iconColor}
                />
                <View style={styles.statusTextContainer}>
                  <Text className="text-sm font-semibold" style={{ color: statusInfo.textColor, opacity: 0.8 }}>
                    Status
                  </Text>
                  <Text className="text-2xl font-bold capitalize" style={{ color: statusInfo.textColor }}>
                    {statusInfo.label}
                  </Text>
                </View>
              </View>
            </View>

            {/* Detected Allergens - Tags */}
            {analysisResult.allergens.length > 0 && (
              <View style={[styles.card, cardShadow]}>
                <Text className="text-lg font-bold mb-4" style={{ color: '#1A1A1A' }}>
                  Detected Allergens
                </Text>
                <View style={styles.tagsContainer}>
                  {analysisResult.allergens.map((allergen, index) => (
                    <AllergenTag
                      key={index}
                      allergen={allergen}
                      variant="detected"
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Precautionary Allergen Labelling - Tags */}
            {analysisResult.pal.length > 0 && (
              <View style={[styles.card, cardShadow]}>
                <Text className="text-lg font-bold mb-4" style={{ color: '#1A1A1A' }}>
                  May Contain Warnings
                </Text>
                <View style={styles.tagsContainer}>
                  {analysisResult.pal.map((warning, index) => (
                    <AllergenTag
                      key={index}
                      allergen={warning}
                      variant="pal"
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Explanation - Structured Comparison List */}
            <View style={[styles.card, cardShadow]}>
              <Text className="text-lg font-bold mb-4" style={{ color: '#1A1A1A' }}>
                Explanation
              </Text>
              <View style={styles.explanationContainer}>
                {parsedExplanation.length > 0 ? (
                  parsedExplanation.map((item, index) => (
                    <View key={index} style={styles.explanationItem}>
                      {item.swedish ? (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                          <Text className="text-base font-bold" style={{ color: '#1A1A1A' }}>
                            {item.swedish}
                          </Text>
                          <Text className="text-base" style={{ color: '#666666', marginHorizontal: 8 }}>
                            →
                          </Text>
                          <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>
                            {highlightAllergens(item.english, analysisResult.allergens)}
                          </View>
                        </View>
                      ) : (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                          {highlightAllergens(item.english, analysisResult.allergens)}
                        </View>
                      )}
                    </View>
                  ))
                ) : (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {highlightAllergens(analysisResult.explanation, analysisResult.allergens)}
                  </View>
                )}
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.card, cardShadow]}>
            <Text className="text-base font-semibold mb-2" style={{ color: '#666666' }}>
              Raw result data:
            </Text>
            <Text className="text-sm font-mono" style={{ color: '#999999' }}>
              {JSON.stringify(result, null, 2)}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating CTA Button */}
      <View
        style={[
          styles.floatingCTA,
          {
            paddingBottom: Math.max(insets.bottom, 16),
            paddingHorizontal: 16,
          },
        ]}
      >
        <AnimatedButton
          onPress={() => navigation.navigate('Scanner')}
          className="items-center justify-center"
          style={[
            styles.ctaButton,
            {
              backgroundColor: '#FF4D2D',
            },
            cardShadow,
          ]}
          accessibilityLabel="Scan another label"
          accessibilityRole="button"
        >
          <Text className="text-white text-lg font-semibold">Scan Another Label</Text>
        </AnimatedButton>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statusHeader: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
  },
  statusHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statusTextContainer: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  explanationContainer: {
    gap: 12,
  },
  explanationItem: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  floatingCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF8F0',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  ctaButton: {
    borderRadius: 9999, // Full pill shape
    paddingVertical: 16,
    minHeight: 48,
  },
});
