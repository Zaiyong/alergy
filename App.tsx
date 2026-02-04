import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { AllergyProfileProvider } from './src/context/AllergyProfileContext';
import { AllergySetupScreen } from './src/screens/AllergySetupScreen';
import { ScannerScreen } from './src/screens/ScannerScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import './global.css';

// Navigation types
export type RootStackParamList = {
  AllergySetup: undefined;
  Scanner: undefined;
  Result: { result: unknown };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <AllergyProfileProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
          initialRouteName="AllergySetup"
          screenOptions={{
            headerShown: false, // Full-screen experience
          }}
        >
          <Stack.Screen name="AllergySetup" component={AllergySetupScreen} />
          <Stack.Screen name="Scanner" component={ScannerScreen} />
          <Stack.Screen name="Result" component={ResultScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AllergyProfileProvider>
  );
}
