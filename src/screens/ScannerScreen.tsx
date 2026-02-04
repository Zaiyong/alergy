import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useAllergyProfile } from '../context/AllergyProfileContext';
import { analyzeLabel, AnalysisError } from '../services/ai/geminiService';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

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
   */
  const processImageForAnalysis = async (imageInput: string, base64?: string) => {
    if (isAnalyzing) {
      return;
    }

    try {
      setIsAnalyzing(true);

      // Prepare image input - use base64 if provided (from camera), otherwise use URI (from gallery)
      const imageData = base64 || imageInput;

      // Call Gemini AI service
      const result = await analyzeLabel(imageData, selectedAllergenIds);

      // Navigate to placeholder result screen (Phase 2 will have proper UI)
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

    try {
      // Take picture with base64 encoding for Gemini API
      // Image to base64 conversion for Gemini API
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8, // Balance between quality and file size
        skipProcessing: false,
      });

      if (!photo?.uri) {
        throw new Error('Failed to capture image');
      }

      // Prepare image input (base64 from expo-camera)
      // expo-camera returns base64 in the photo object if base64: true
      const imageBase64 = photo.base64 || photo.uri;

      // Process image using unified function
      await processImageForAnalysis(photo.uri, imageBase64);
    } catch (error) {
      // Error handling is done in processImageForAnalysis, but catch any unexpected errors here
      if (error instanceof Error && !(error instanceof AnalysisError)) {
        Alert.alert('Capture Error', error.message, [{ text: 'OK' }]);
      }
    }
  };

  /**
   * Handle image selection from gallery
   */
  const handlePickImage = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/52570910-b74d-4299-a2e7-eb94fabce7bf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ScannerScreen.tsx:handlePickImage',message:'handlePickImage called',data:{isAnalyzing},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/52570910-b74d-4299-a2e7-eb94fabce7bf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ScannerScreen.tsx:handleTakePhoto',message:'handleTakePhoto called',data:{isAnalyzing},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (isAnalyzing) {
      return;
    }

    try {
      // Request camera permission for web
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/52570910-b74d-4299-a2e7-eb94fabce7bf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ScannerScreen.tsx:handleTakePhoto',message:'Requesting camera permission',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/52570910-b74d-4299-a2e7-eb94fabce7bf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ScannerScreen.tsx:handleTakePhoto',message:'Camera permission result',data:{granted:cameraPermission.granted,status:cameraPermission.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      if (!cameraPermission.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Camera access is required to take photos.'
        );
        return;
      }

      // Launch camera via ImagePicker (works on mobile browsers)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/52570910-b74d-4299-a2e7-eb94fabce7bf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ScannerScreen.tsx:handleTakePhoto',message:'Calling launchCameraAsync',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
        base64: false,
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/52570910-b74d-4299-a2e7-eb94fabce7bf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ScannerScreen.tsx:handleTakePhoto',message:'launchCameraAsync result',data:{canceled:result.canceled,assetsCount:result.assets?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      if (result.canceled) {
        return;
      }

      const imageUri = result.assets[0]?.uri;
      if (!imageUri) {
        throw new Error('Failed to capture photo');
      }

      await processImageForAnalysis(imageUri);
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/52570910-b74d-4299-a2e7-eb94fabce7bf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ScannerScreen.tsx:handleTakePhoto',message:'Error in handleTakePhoto',data:{errorMessage:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      if (error instanceof Error && !(error instanceof AnalysisError)) {
        Alert.alert('Camera Error', error.message, [{ text: 'OK' }]);
      }
    }
  };

  if (!permission) {
    // Permission status is still loading
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#ffffff" />
        <Text className="text-white mt-4">Checking camera permissions...</Text>
      </View>
    );
  }

  // If camera permission is not granted, show option to use gallery or request camera permission
  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-black px-4">
        <Text className="text-white text-xl font-bold mb-4 text-center">
          Camera Permission Required
        </Text>
        <Text className="text-white text-center mb-6">
          You can use your gallery to select an image, or grant camera access to take a photo.
        </Text>
        <View className="w-full space-y-3">
          <TouchableOpacity
            onPress={handlePickImage}
            disabled={isAnalyzing}
            className="bg-blue-500 px-6 py-3 rounded-lg items-center"
          >
            <Text className="text-white font-semibold">Upload from Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={requestPermission}
            className="bg-gray-700 px-6 py-3 rounded-lg items-center"
          >
            <Text className="text-white font-semibold">Grant Camera Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // On web, show simplified UI - expo-image-picker doesn't differentiate camera/gallery on web
  if (isWeb) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-900 px-4">
        <Text className="text-white text-2xl font-bold mb-4 text-center">
          Scan Ingredient Label
        </Text>
        <Text className="text-gray-300 text-center mb-8">
          Select or capture an image of a food ingredient label to check for allergens.
        </Text>
        
        {isAnalyzing ? (
          <View className="flex-row items-center px-8 py-4">
            <ActivityIndicator size="small" color="#ffffff" />
            <Text className="text-white font-semibold ml-2">Analyzing...</Text>
          </View>
        ) : (
          <View className="w-full max-w-xs space-y-4">
            {/* Single button that opens file picker - on mobile it may offer camera option */}
            <TouchableOpacity
              onPress={handlePickImage}
              disabled={isAnalyzing}
              className="bg-blue-500 px-8 py-4 rounded-xl items-center w-full"
            >
              <Text className="text-white text-lg font-semibold">📷 Select Image</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <Text className="text-gray-400 text-sm mt-6 text-center px-4">
          On mobile devices, you may be able to choose between camera and gallery.
          For the best camera experience, use the native mobile app.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mt-6 px-4 py-2"
        >
          <Text className="text-blue-400 text-sm">← Back to Allergy Setup</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={CameraType.back}
        mode="picture"
      />

      {/* Overlay UI */}
      <View className="flex-1 justify-end pb-8 px-4">
        {/* Instructions */}
        <View className="bg-black/60 rounded-lg p-4 mb-4">
          <Text className="text-white text-center text-base">
            Position the ingredient label in the frame or upload from gallery
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="flex-row items-center justify-center space-x-6">
          {/* Upload from Gallery Button */}
          <View className="items-center">
            <TouchableOpacity
              onPress={handlePickImage}
              disabled={isAnalyzing}
              className={`w-16 h-16 rounded-full items-center justify-center border-2 ${
                isAnalyzing ? 'bg-gray-500 border-gray-400' : 'bg-blue-500 border-blue-300'
              }`}
              accessibilityLabel="Upload from gallery"
              accessibilityRole="button"
              accessibilityState={{ disabled: isAnalyzing }}
            >
              {isAnalyzing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-white text-xl font-bold">↑</Text>
              )}
            </TouchableOpacity>
            <Text className="text-white mt-2 text-xs text-center">
              Gallery
            </Text>
          </View>

          {/* Capture Button */}
          <View className="items-center">
            <TouchableOpacity
              onPress={handleCapture}
              disabled={isAnalyzing}
              className={`w-20 h-20 rounded-full items-center justify-center ${
                isAnalyzing ? 'bg-gray-500' : 'bg-white'
              }`}
              accessibilityLabel="Capture photo"
              accessibilityRole="button"
              accessibilityState={{ disabled: isAnalyzing }}
            >
              {isAnalyzing ? (
                <ActivityIndicator size="large" color="#3b82f6" />
              ) : (
                <View className="w-16 h-16 rounded-full border-4 border-gray-800" />
              )}
            </TouchableOpacity>
            <Text className="text-white mt-2 text-xs text-center">
              {isAnalyzing ? 'Analyzing...' : 'Capture'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};
