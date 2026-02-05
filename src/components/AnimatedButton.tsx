import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, ViewStyle, TextStyle } from 'react-native';

interface AnimatedButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'checkbox' | 'link' | 'none';
  accessibilityState?: { disabled?: boolean; checked?: boolean };
}

/**
 * Animated Button Component with Pazzi Pizza Style
 * 
 * Features:
 * - Bounce animation on press
 * - Large rounded corners (doughy feel)
 * - Vibrant colors
 */
export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  onPress,
  children,
  disabled = false,
  className = '',
  textClassName = '',
  style,
  accessibilityLabel,
  accessibilityRole = 'button',
  accessibilityState,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePress = () => {
    if (!disabled) {
      // Bounce effect
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 0.9,
          useNativeDriver: true,
          tension: 200,
          friction: 3,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        }),
      ]).start();
      
      onPress();
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        className={className}
        style={style}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole}
        accessibilityState={accessibilityState}
        activeOpacity={0.8}
      >
        {typeof children === 'string' ? (
          <Text className={textClassName}>{children}</Text>
        ) : (
          children
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};
