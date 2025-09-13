# 🔍 Sign-In Debug Guide

## ✅ Current Status

### What's Working:
- ✅ **Supabase Configuration**: OAuth URL generation works
- ✅ **Google Credentials**: Client ID and Secret are available
- ✅ **Environment Setup**: All environment variables are set
- ✅ **In-App Browser**: WebBrowser implementation is in place

### What's Enhanced:
- ✅ **Detailed Logging**: Added comprehensive debug logs
- ✅ **Error Handling**: Better error detection and reporting
- ✅ **Token Processing**: Enhanced token extraction from callback URLs

## 🔍 Debug Process

### Step 1: Test Your App
```bash
npm start
```

### Step 2: Watch Console Logs
When you click "Sign in with Google", you should see these logs:

```
🔐 Google sign-in initiated (in-app browser)
🔄 Requesting OAuth URL from Supabase...
✅ OAuth URL generated successfully
🔗 OAuth URL preview: https://mwzeumckccvkrsmixsea.supabase.co/auth/v1/authorize?provider=google...
🚀 Opening in-app browser...
```

### Step 3: Check WebBrowser Result
After completing Google sign-in, look for:

```
🔄 WebBrowser result type: success
🔄 WebBrowser full result: {"type": "success", "url": "sidequest://auth/callback#access_token=..."}
✅ OAuth completed successfully
🔗 Full callback URL: sidequest://auth/callback#access_token=...
```

### Step 4: Token Processing
Look for token extraction logs:

```
🔍 Checking for access token in URL...
✅ Access token found in URL
🔍 Hash fragment: access_token=...&refresh_token=...
🔑 Access token: Present
🔑 Refresh token: Present
🔑 Setting session with tokens...
✅ Session set successfully!
👤 User email: user@example.com
👤 User ID: uuid-here
```

## 🚨 Common Issues & Solutions

### Issue 1: "No OAuth URL received from Supabase"
**Cause**: Google OAuth provider not configured in Supabase
**Solution**: 
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/mwzeumckccvkrsmixsea/auth/providers)
2. Enable Google provider
3. Add your Client ID: `62028900811-6nunu701276fhkodka33dgg0n9jqgchn.apps.googleusercontent.com`
4. Add your Client Secret: `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`

### Issue 2: WebBrowser result type is "cancel" or "dismiss"
**Cause**: User cancelled or browser closed unexpectedly
**Solution**: This is normal user behavior, no action needed

### Issue 3: "No access token found in callback URL"
**Cause**: OAuth flow didn't complete properly
**Solutions**:
1. Check Google Cloud Console redirect URI: `https://mwzeumckccvkrsmixsea.supabase.co/auth/v1/callback`
2. Verify Google OAuth consent screen is configured
3. Check network connectivity

### Issue 4: "Error setting session"
**Cause**: Invalid tokens or Supabase configuration issue
**Solution**: Check console logs for specific error details

## 🔧 Configuration Checklist

### Google Cloud Console:
- [ ] OAuth 2.0 Client ID created
- [ ] Redirect URI: `https://mwzeumckccvkrsmixsea.supabase.co/auth/v1/callback`
- [ ] OAuth consent screen configured

### Supabase Dashboard:
- [ ] Google OAuth provider enabled
- [ ] Client ID and Secret configured
- [ ] Redirect URLs configured (optional for in-app browser)

### App Configuration:
- [ ] WebBrowser package installed
- [ ] Enhanced logging implemented
- [ ] Error handling in place

## 📱 Testing Steps

1. **Open your app**
2. **Click "Sign in with Google"**
3. **Check console for detailed logs**
4. **Complete Google sign-in in in-app browser**
5. **Verify successful session creation**

## 🆘 If Still Not Working

### Check These Logs:
1. **OAuth URL generation**: Should show successful URL creation
2. **WebBrowser result**: Should show `type: "success"`
3. **Token extraction**: Should find access_token and refresh_token
4. **Session creation**: Should show successful user session

### Get Help:
- Share the console logs showing where the process fails
- Check specific error messages in the enhanced logging
- Verify all configuration steps are completed

## 🎯 Success Indicators

When everything works correctly, you'll see:
- ✅ In-app browser opens with Google OAuth
- ✅ User completes sign-in
- ✅ Browser automatically closes
- ✅ User is signed in to your app
- ✅ App navigates to main screen

The enhanced logging will help you identify exactly where any issues occur!
