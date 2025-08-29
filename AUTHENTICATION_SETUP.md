# Authentication Setup Guide

This guide will help you set up Google and Apple Sign-In for your Sidequest app.

## Prerequisites

- Expo CLI installed
- Google Cloud Console account
- Apple Developer account (for iOS)

## 1. Google Sign-In Setup

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sign-In API

### Step 2: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Create credentials for:
   - **Android**: Use your app's package name (`com.yourcompany.sidequest`)
   - **iOS**: Use your app's bundle identifier (`com.yourcompany.sidequest`)
   - **Web**: Use your app's web URL (if applicable)

### Step 3: Update Configuration
1. Open `lib/auth-config.ts`
2. Replace the placeholder client IDs with your actual client IDs:
   ```typescript
   export const AUTH_CONFIG = {
     google: {
       androidClientId: 'your-android-client-id.apps.googleusercontent.com',
       iosClientId: 'your-ios-client-id.apps.googleusercontent.com',
       webClientId: 'your-web-client-id.apps.googleusercontent.com',
     },
     // ...
   };
   ```

## 2. Apple Sign-In Setup

### Step 1: Configure Apple Developer Account
1. Go to [Apple Developer Console](https://developer.apple.com/)
2. Navigate to "Certificates, Identifiers & Profiles"
3. Select your app identifier
4. Enable "Sign In with Apple" capability

### Step 2: Update App Configuration
1. Open `app.json`
2. Update the bundle identifier to match your Apple Developer account:
   ```json
   {
     "expo": {
       "ios": {
         "bundleIdentifier": "com.yourcompany.sidequest"
       },
       "android": {
         "package": "com.yourcompany.sidequest"
       }
     }
   }
   ```

## 3. Testing Authentication

### Development Testing
1. Run `npx expo start`
2. Test on a physical device (authentication doesn't work in simulators)
3. Try both Google and Apple Sign-In flows

### Common Issues
- **Google Sign-In fails**: Check that your client IDs are correct and the API is enabled
- **Apple Sign-In not showing**: Ensure you're testing on a physical iOS device
- **Bundle identifier mismatch**: Make sure your app.json matches your Apple Developer account

## 4. Production Deployment

### Before Deploying
1. Update all client IDs with production credentials
2. Test authentication on both platforms
3. Ensure your app's bundle identifier is consistent across all configurations

### Environment Variables (Optional)
For better security, you can move client IDs to environment variables:

1. Create `.env` file:
   ```
   GOOGLE_ANDROID_CLIENT_ID=your-android-client-id
   GOOGLE_IOS_CLIENT_ID=your-ios-client-id
   ```

2. Update `lib/auth-config.ts`:
   ```typescript
   export const AUTH_CONFIG = {
     google: {
       androidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID || 'fallback-id',
       iosClientId: process.env.GOOGLE_IOS_CLIENT_ID || 'fallback-id',
     },
   };
   ```

## 5. Security Best Practices

- Never commit real client IDs to version control
- Use environment variables for sensitive data
- Regularly rotate your OAuth credentials
- Monitor authentication logs for suspicious activity

## 6. Troubleshooting

### Google Sign-In Issues
- Verify your SHA-1 fingerprint is correct for Android
- Check that the Google Sign-In API is enabled
- Ensure your app's package name matches the OAuth client

### Apple Sign-In Issues
- Apple Sign-In only works on physical iOS devices
- Verify your app has the "Sign In with Apple" capability
- Check that your bundle identifier matches your Apple Developer account

### General Issues
- Clear app cache and reinstall if authentication stops working
- Check network connectivity
- Verify that your app's scheme is correctly configured

## Support

If you encounter issues:
1. Check the [Expo documentation](https://docs.expo.dev/)
2. Review the [Google Sign-In guide](https://developers.google.com/identity/sign-in/android/start)
3. Check the [Apple Sign-In documentation](https://developer.apple.com/sign-in-with-apple/) 