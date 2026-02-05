# YumSafe

A high-performance, EU-compliant AI Food Allergy Scanner built with React Native (Expo) and Google Gemini AI. Scan food ingredient labels in real-time or upload images to detect allergens and "May contain" warnings.

## 🌟 Features

- **14 EU Mandatory Allergens**: Select from all allergens required by EU Regulation 1169/2011
- **Camera Scanner**: Real-time ingredient label capture using device camera
- **Image Upload**: Upload images from your device gallery for analysis
- **AI-Powered Analysis**: Uses Gemini 2.0 Flash to analyze labels in multiple languages (EN, DE, FR, ES)
- **Privacy-First**: All allergy data stored locally on device only
- **Traffic Light System**: Clear safe/caution/unsafe indicators (Phase 2)
- **Multilingual Support**: Analyzes labels in English, German, French, and Spanish

## 🛠 Tech Stack

- **Framework**: React Native (Expo Managed Workflow)
- **Navigation**: React Navigation (Native Stack)
- **UI**: NativeWind (Tailwind CSS for React Native)
- **Camera**: expo-camera
- **Image Picker**: expo-image-picker
- **AI**: Google Generative AI SDK (@google/generative-ai) with Gemini 2.0 Flash
- **State Management**: React Context API
- **Storage**: AsyncStorage (local device storage)
- **Language**: TypeScript (strict mode)

## 📋 Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli` (optional, can use npx)
- Expo Go app on your mobile device (for testing) or use web/iOS simulator/Android emulator
- Google Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## 🚀 Setup

### 1. Clone the repository

```bash
git clone https://github.com/Zaiyong/alergy.git
cd alergy
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example environment file and add your Gemini API key:

```bash
cp .env.example .env
```

Edit `.env` and add your API key:

```
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey).

### 4. Run the app

```bash
# Start Expo development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web (limited camera support, but image upload works)
npm run web
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components (Phase 2)
├── constants/          # App constants (EU allergens list)
│   └── allergens.ts
├── context/            # React Context (Allergy Profile)
│   ├── AllergyProfileContext.tsx
│   └── types.ts
├── screens/            # Screen components
│   ├── AllergySetupScreen.tsx  # Onboarding: select allergens
│   ├── ScannerScreen.tsx       # Camera + image upload
│   └── ResultScreen.tsx        # Analysis results display
├── services/
│   └── ai/             # Gemini AI service
│       ├── geminiService.ts    # Main AI analysis logic
│       └── types.ts             # TypeScript types
└── i18n/               # Reserved for Phase 2 (multilingual UI)
```

## ✅ Phase 1 Status

- ✅ Expo + TypeScript + NativeWind setup
- ✅ React Navigation (Native Stack)
- ✅ 14 EU allergens constants
- ✅ Allergy Profile Context with AsyncStorage
- ✅ Gemini AI service with image analysis (Gemini 2.0 Flash)
- ✅ Allergy Setup onboarding screen
- ✅ Scanner screen with camera capture
- ✅ Image upload from gallery
- ✅ Placeholder Result screen
- ✅ Error handling and user feedback

## 🔮 Phase 2 (Planned)

- Traffic light UI (Red/Yellow/Green) for results
- i18next integration (EN, DE, FR, ES) for UI strings
- Enhanced result explanations
- History/scan log
- Better error handling UI
- Offline mode support

## 🇪🇺 EU Compliance

This app analyzes food labels according to **EU Regulation 1169/2011 (Annex II)**, which mandates declaration of 14 allergens:

1. Cereals containing gluten
2. Crustaceans
3. Eggs
4. Fish
5. Peanuts
6. Soybeans
7. Milk
8. Tree nuts
9. Celery
10. Mustard
11. Sesame seeds
12. Sulphur dioxide and sulphites
13. Lupin
14. Molluscs

## 🔒 Privacy

- All allergy profile data is stored locally on your device using AsyncStorage
- No data is sent to external servers except for the Gemini API (image analysis only)
- No user tracking or analytics
- Images are processed by Gemini API but not stored by the app

## 🐛 Troubleshooting

### API Key Issues
- Ensure `.env` file is in the project root (not in `src/`)
- Restart the Expo dev server after adding/changing `.env`
- Verify your API key is valid at [Google AI Studio](https://makersuite.google.com/app/apikey)

### Camera Permissions
- On iOS: Grant camera permission when prompted
- On Android: Check app settings if permission is denied
- Web: Camera may not work; use image upload instead

### Image Analysis Fails
- Ensure image is clear and contains readable ingredient text
- Check internet connection (API calls require network)
- Verify API key has sufficient quota

## 📝 License

Private project - All rights reserved

## 🤝 Contributing

This is a private project. Contributions are not currently accepted.

## 📧 Contact

For questions or issues, please open an issue on GitHub.
