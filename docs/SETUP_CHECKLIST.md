# ✅ Google OAuth Setup Checklist

## 🚀 Quick Setup Steps

### Step 1: Google Cloud Console (5 minutes)
1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Create or select a project**
3. **Enable Google+ API**:
   - APIs & Services → Library
   - Search "Google+ API" → Enable
4. **Set up OAuth Consent Screen**:
   - APIs & Services → OAuth consent screen
   - External → Fill app name: "Sidequest"
   - Add your email addresses
5. **Create Web OAuth Client**:
   - APIs & Services → Credentials
   - Create Credentials → OAuth 2.0 Client ID
   - Web application
   - Name: "Sidequest Web"
   - Authorized redirect URIs: `https://mwzeumckccvkrsmixsea.supabase.co/auth/v1/callback`
   - **COPY THE CLIENT ID AND SECRET** 📝

### Step 2: Supabase Configuration (2 minutes)
1. **Go to [Supabase Dashboard](https://supabase.com/dashboard/project/mwzeumckccvkrsmixsea)**
2. **Authentication → Providers → Google**
3. **Enable Google provider**
4. **Paste your Client ID and Client Secret from Step 1**
5. **Authentication → URL Configuration**:
   - Add to Redirect URLs:
     ```
     sidequest://auth/callback
     exp://localhost:8081/--/auth/callback
     http://localhost:8081/auth/callback
     ```
   - Site URL: `sidequest://`

### Step 3: Test (1 minute)
1. **Run your app**: `npm start`
2. **Try Google sign-in**
3. **Check logs for any errors**

## 🎯 Current Status
- ✅ Supabase configured with your credentials
- ✅ App bundle ID updated to `com.davejaga.sidequest`
- ✅ Auth callback component updated
- ⏳ **Need to complete**: Google Cloud Console setup
- ⏳ **Need to complete**: Supabase OAuth provider configuration

## 🔧 Next Steps
1. Complete Google Cloud Console setup (Step 1 above)
2. Configure Supabase OAuth (Step 2 above)
3. Test the authentication flow

## 🆘 If You Get Stuck
- Check the detailed guide in `GOOGLE_OAUTH_SETUP.md`
- Common issue: Make sure redirect URI in Google Console exactly matches Supabase
- Test in Expo Go first, then standalone builds

## 📞 Ready to Test?
Once you complete Steps 1-2, run:
```bash
npm start
```
Then test Google sign-in on a physical device (OAuth doesn't work in simulators).
