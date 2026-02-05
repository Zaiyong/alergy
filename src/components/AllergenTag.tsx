import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getAllergenIcon, AllergenId } from '../constants/allergens';

interface AllergenTagProps {
  allergen: string;
  variant?: 'detected' | 'pal';
  icon?: string;
}

/**
 * AllergenTag Component
 * Displays an allergen as a tag/chip with icon and name
 */
export const AllergenTag: React.FC<AllergenTagProps> = ({
  allergen,
  variant = 'detected',
  icon,
}) => {
  // Try to match allergen name to an AllergenId to get the icon
  const allergenLower = allergen.toLowerCase();
  let iconName = icon;
  
  // Simple matching logic to find allergen ID
  if (!iconName) {
    const allergenMap: Record<string, AllergenId> = {
      'gluten': 'gluten',
      'wheat': 'gluten',
      'milk': 'milk',
      'dairy': 'milk',
      'egg': 'eggs',
      'eggs': 'eggs',
      'peanut': 'peanuts',
      'peanuts': 'peanuts',
      'soy': 'soybeans',
      'soybean': 'soybeans',
      'soybeans': 'soybeans',
      'fish': 'fish',
      'crustacean': 'crustaceans',
      'crustaceans': 'crustaceans',
      'tree nut': 'tree_nuts',
      'tree nuts': 'tree_nuts',
      'nut': 'tree_nuts',
      'celery': 'celery',
      'mustard': 'mustard',
      'sesame': 'sesame',
      'sulphite': 'sulphites',
      'sulphites': 'sulphites',
      'lupin': 'lupin',
      'mollusc': 'molluscs',
      'molluscs': 'molluscs',
    };
    
    const matchedId = Object.keys(allergenMap).find(key => 
      allergenLower.includes(key)
    );
    
    if (matchedId) {
      iconName = getAllergenIcon(allergenMap[matchedId]);
    } else {
      iconName = 'help-outline';
    }
  }

  // Styling based on variant
  const tagStyles = variant === 'detected' 
    ? {
        backgroundColor: '#FEF2F2', // Soft red background
        borderColor: '#FECACA',
        textColor: '#991B1B', // Dark red text
        iconColor: '#DC2626',
      }
    : {
        backgroundColor: '#FFFBEB', // Soft yellow/amber background
        borderColor: '#FDE68A',
        textColor: '#92400E', // Dark orange text
        iconColor: '#D97706',
      };

  return (
    <View
      style={[
        styles.tag,
        {
          backgroundColor: tagStyles.backgroundColor,
          borderColor: tagStyles.borderColor,
        },
      ]}
    >
      <MaterialIcons
        name={iconName as any}
        size={18}
        color={tagStyles.iconColor}
        style={styles.icon}
      />
      <Text
        style={[
          styles.text,
          { color: tagStyles.textColor },
        ]}
        numberOfLines={1}
      >
        {allergen}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20, // Pill shape
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
});
