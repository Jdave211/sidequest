// Authentication Configuration
// Replace these with your actual client IDs from Google Cloud Console and Apple Developer Console

export const AUTH_CONFIG = {
  google: {
    androidClientId: 'YOUR_ANDROID_CLIENT_ID', // Get from Google Cloud Console
    iosClientId: 'YOUR_IOS_CLIENT_ID', // Get from Google Cloud Console
    webClientId: 'YOUR_WEB_CLIENT_ID', // Get from Google Cloud Console
  },
  apple: {
    // Apple Sign-In is configured through the Apple Developer Console
    // No additional configuration needed here
  },
};

// Instructions for setting up authentication:
//
// 1. Google Sign-In Setup:
//    - Go to https://console.cloud.google.com/
//    - Create a new project or select existing one
//    - Enable Google Sign-In API
//    - Create OAuth 2.0 credentials for Android and iOS
//    - Replace the client IDs above with your actual client IDs
//
// 2. Apple Sign-In Setup:
//    - Go to https://developer.apple.com/
//    - Add "Sign In with Apple" capability to your app
//    - Configure the capability in your Apple Developer account
//    - No additional configuration needed in the code
//
// 3. Update app.json:
//    - Replace "com.yourcompany.sidequest" with your actual bundle identifier
//    - Update the scheme to match your app's scheme 