import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LottieView from 'lottie-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

const welcomeAnimation = require('../../assets/animations/Welcome.json');

type RootStackParamList = {
  Welcome: undefined;
  AllergySetup: undefined;
  Scanner: undefined;
  Result: { result: unknown };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    // Start animation when component mounts
    animationRef.current?.play();
  }, []);

  const handleAnimationFinish = () => {
    // Navigate to AllergySetup after animation completes
    // Add a small delay for better UX
    setTimeout(() => {
      navigation.replace('AllergySetup');
    }, 500);
  };

  const handleScreenPress = () => {
    // Navigate to AllergySetup immediately when user taps screen
    navigation.replace('AllergySetup');
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handleScreenPress}
      className="flex-1 items-center justify-center"
      style={{ backgroundColor: '#FFF8F0' }}
    >
      <LottieView
        ref={animationRef}
        source={welcomeAnimation}
        style={styles.animation}
        loop={false}
        autoPlay={true}
        onAnimationFinish={handleAnimationFinish}
      />
      <Text className="text-2xl font-bold mt-8" style={{ color: '#FF4D2D' }}>
        Welcome to YumSafe
      </Text>
      <Text className="text-base mt-2 text-center px-8" style={{ color: '#666' }}>
        Your allergy scanning companion
      </Text>
      <Text className="text-sm mt-4 text-center px-8" style={{ color: '#999' }}>
        Tap anywhere to continue
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  animation: {
    width: 300,
    height: 200,
  },
});
