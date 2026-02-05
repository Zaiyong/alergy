import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Alert, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useAllergyProfile } from '../context/AllergyProfileContext';
import { analyzeLabel, AnalysisError } from '../services/ai/geminiService';
import { resizeImageForAnalysis } from '../services/imageUtils';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnimatedButton } from '../components/AnimatedButton';

// Check if running on web platform - CameraView doesn't work well on web
const isWeb = Platform.OS === 'web';

type RootStackParamList = {
  AllergySetup: undefined;
  Scanner: undefined;
  Result: { result: unknown };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Scanner'>;

export const ScannerScreen: React.FC<Props> = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaLibraryPermission, requestMediaLibraryPermission] = ImagePicker.useMediaLibraryPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const { selectedAllergenIds } = useAllergyProfile();

  // Request permission on mount
  useEffect(() => {
    if (permission && !permission.granted && !permission.canAskAgain) {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera access in your device settings to scan ingredient labels.',
        [{ text: 'OK' }]
      );
    }
  }, [permission]);

  /**
   * Unified image processing function
   * Handles both camera photos (with base64) and gallery images (URI only)
   * Now includes image resizing for optimal API processing
   */
  const processImageForAnalysis = async (imageInput: string) => {
    if (isAnalyzing) {
      return;
    }

    try {
      setIsAnalyzing(true);

      // Step 1: Resize the image for optimal API processing (max 1024px)
      const resizedImage = await resizeImageForAnalysis(imageInput);

      // Step 2: Use the resized base64 for analysis
      // Add data URI prefix so geminiService correctly identifies it as base64
      const imageData = `data:image/jpeg;base64,${resizedImage.base64}`;

      // Step 3: Call Gemini AI service
      const result = await analyzeLabel(imageData, selectedAllergenIds);

      // Step 4: Navigate to result screen
      navigation.navigate('Result', { result });
    } catch (error) {
      // Handle different error types with user-friendly messages
      let errorMessage = 'An error occurred while analyzing the label.';
      let errorTitle = 'Analysis Error';

      if (error instanceof AnalysisError) {
        switch (error.code) {
          case 'BLURRY_IMAGE':
            errorTitle = 'Image Too Blurry';
            errorMessage = 'The image is too blurry to read ingredients. Please try again with a clearer shot.';
            break;
          case 'NO_INGREDIENTS':
            errorTitle = 'No Ingredients Found';
            errorMessage = 'Could not find any ingredients in the image. Please make sure the label is clearly visible.';
            break;
          case 'API_TIMEOUT':
            errorTitle = 'Request Timeout';
            errorMessage = 'The analysis took too long. Please check your internet connection and try again.';
            break;
          case 'API_ERROR':
            errorTitle = 'API Error';
            errorMessage = `API error: ${error.message}. Please check your API key configuration.`;
            break;
          case 'INVALID_IMAGE':
            errorTitle = 'Invalid Image';
            errorMessage = `Image error: ${error.message}`;
            break;
          default:
            errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      Alert.alert(errorTitle, errorMessage, [{ text: 'OK' }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current || isAnalyzing) {
      return;
    }

    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Camera access is required to scan ingredient labels.'
        );
        return;
      }
    }

    if (!cameraRef.current || isAnalyzing) {
      return;
    }

    try {
      // Take picture with base64 encoding for Gemini API
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
        skipProcessing: false,
      });

      if (!photo?.uri) {
        throw new Error('Failed to capture image');
      }

      await processImageForAnalysis(photo.uri);
    } catch (error) {
      if (error instanceof Error && !(error instanceof AnalysisError)) {
        Alert.alert('Capture Error', error.message, [{ text: 'OK' }]);
      }
    }
  };

  /**
   * Handle image selection from gallery
   */
  const handlePickImage = async () => {
    if (isAnalyzing) {
      return;
    }

    // Request media library permission if needed
    if (!mediaLibraryPermission?.granted) {
      const result = await requestMediaLibraryPermission();
      if (!result.granted) {
        Alert.alert(
          'Photo Library Permission Required',
          'Photo library access is required to select images for scanning.'
        );
        return;
      }
    }

    try {
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8, // Match camera quality
        base64: false, // We'll convert URI to base64 in the service
      });

      // Check if user cancelled
      if (result.canceled) {
        return; // User cancelled, do nothing
      }

      // Get the selected image URI
      const imageUri = result.assets[0]?.uri;
      if (!imageUri) {
        throw new Error('Failed to get selected image');
      }

      // Process image using unified function (URI only, no base64)
      await processImageForAnalysis(imageUri);
    } catch (error) {
      // Error handling is done in processImageForAnalysis, but catch any unexpected errors here
      if (error instanceof Error && !(error instanceof AnalysisError)) {
        Alert.alert('Image Selection Error', error.message, [{ text: 'OK' }]);
      }
    }
  };

  /**
   * Handle taking a photo with the browser/device camera
   * Works on mobile browsers through the browser's camera API
   */
  const handleTakePhoto = async () => {
    if (isAnalyzing) {
      return;
    }

    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPermission.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Camera access is required to take photos.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
        base64: false,
      });

      if (result.canceled) {
        return;
      }

      const imageUri = result.assets[0]?.uri;
      if (!imageUri) {
        throw new Error('Failed to capture photo');
      }

      await processImageForAnalysis(imageUri);
    } catch (error) {
      if (error instanceof Error && !(error instanceof AnalysisError)) {
        Alert.alert('Camera Error', error.message, [{ text: 'OK' }]);
      }
    }
  };

  if (!permission) {
    // Permission status is still loading
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#FF4D2D" />
        <Text className="text-white mt-4 font-semibold">Checking camera permissions...</Text>
      </View>
    );
  }

  // If camera permission is not granted, show option to use gallery or request camera permission
  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center px-4" style={{ backgroundColor: '#000' }}>
        <Text className="text-white text-2xl font-bold mb-4 text-center">
          Camera Permission Required
        </Text>
        <Text className="text-white text-center mb-8" style={{ color: '#CCC' }}>
          You can use your gallery to select an image, or grant camera access to take a photo.
        </Text>
        <View className="w-full space-y-4">
          <AnimatedButton
            onPress={handlePickImage}
            disabled={isAnalyzing}
            className="px-6 py-4 rounded-doughy items-center"
            style={{ backgroundColor: '#FF4D2D' }}
            accessibilityLabel="Upload from gallery"
            accessibilityRole="button"
            accessibilityState={{ disabled: isAnalyzing }}
          >
            <Text className="text-white text-lg font-bold">Upload from Gallery</Text>
          </AnimatedButton>
          <AnimatedButton
            onPress={requestPermission}
            className="px-6 py-4 rounded-doughy items-center"
            style={{ backgroundColor: '#333' }}
            accessibilityLabel="Grant camera permission"
            accessibilityRole="button"
          >
            <Text className="text-white text-lg font-bold">Grant Camera Permission</Text>
          </AnimatedButton>
        </View>
      </View>
    );
  }

  // On web, show simplified UI - expo-image-picker doesn't differentiate camera/gallery on web
  if (isWeb) {
    return (
      <View className="flex-1 items-center justify-center px-4" style={{ backgroundColor: '#1a1a1a' }}>
        <Text className="text-white text-3xl font-bold mb-4 text-center">
          Scan Ingredient Label
        </Text>
        <Text className="text-center mb-8" style={{ color: '#CCC' }}>
          Select or capture an image of a food ingredient label to check for allergens.
        </Text>
        
        {isAnalyzing ? (
          <View className="flex-row items-center px-8 py-4">
            <ActivityIndicator size="small" color="#FF4D2D" />
            <Text className="text-white font-bold ml-2">Analyzing...</Text>
          </View>
        ) : (
          <View className="w-full max-w-xs space-y-4">
            {/* Single button that opens file picker - on mobile it may offer camera option */}
            <AnimatedButton
              onPress={handlePickImage}
              disabled={isAnalyzing}
              className="px-8 py-5 rounded-doughy-lg items-center w-full"
              style={{ backgroundColor: '#FF4D2D' }}
              accessibilityLabel="Select image"
              accessibilityRole="button"
              accessibilityState={{ disabled: isAnalyzing }}
            >
              <Text className="text-white text-xl font-bold">📷 Select Image</Text>
            </AnimatedButton>
          </View>
        )}
        
        <Text className="text-sm mt-6 text-center px-4" style={{ color: '#999' }}>
          On mobile devices, you may be able to choose between camera and gallery.
          For the best camera experience, use the native mobile app.
        </Text>
        <AnimatedButton
          onPress={() => navigation.goBack()}
          className="mt-6 px-4 py-2"
        >
          <Text className="text-sm font-semibold" style={{ color: '#FFC30B' }}>← Back to Allergy Setup</Text>
        </AnimatedButton>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        mode="picture"
      />

      {/* Overlay UI */}
      <View className="flex-1 justify-end pb-8 px-4">
        {/* Instructions */}
        <View className="rounded-doughy p-4 mb-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
          <Text className="text-white text-center text-base font-semibold">
            Position the ingredient label in the frame or upload from gallery
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="flex-row items-center justify-center space-x-6">
          {/* Upload from Gallery Button */}
          <View className="items-center">
            <AnimatedButton
              onPress={handlePickImage}
              disabled={isAnalyzing}
              className="w-16 h-16 rounded-full items-center justify-center border-2"
              style={{
                backgroundColor: isAnalyzing ? '#666' : '#FF4D2D',
                borderColor: isAnalyzing ? '#888' : '#FFC30B',
              }}
              accessibilityLabel="Upload from gallery"
              accessibilityRole="button"
              accessibilityState={{ disabled: isAnalyzing }}
            >
              {isAnalyzing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-white text-xl font-bold">↑</Text>
              )}
            </AnimatedButton>
            <Text className="text-white mt-2 text-xs text-center font-semibold">
              Gallery
            </Text>
          </View>

          {/* Capture Button */}
          <View className="items-center">
            <AnimatedButton
              onPress={handleCapture}
              disabled={isAnalyzing}
              className="w-20 h-20 rounded-full items-center justify-center"
              style={{
                backgroundColor: isAnalyzing ? '#666' : '#FFC30B',
              }}
              accessibilityLabel="Capture photo"
              accessibilityRole="button"
              accessibilityState={{ disabled: isAnalyzing }}
            >
              {isAnalyzing ? (
                <ActivityIndicator size="large" color="#FF4D2D" />
              ) : (
                <View className="w-16 h-16 rounded-full border-4" style={{ borderColor: '#FF4D2D' }} />
              )}
            </AnimatedButton>
            <Text className="text-white mt-2 text-xs text-center font-semibold">
              {isAnalyzing ? 'Analyzing...' : 'Capture'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};
