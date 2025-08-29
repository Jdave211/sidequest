# Supabase Authentication Setup for Mobile OAuth

## 🔧 Configure Redirect URLs in Supabase

You need to add these redirect URLs in your Supabase dashboard for Google OAuth to work:

### 1. Go to Supabase Dashboard
- Navigate to: https://supabase.com/dashboard/project/mwzeumckccvkrsmixsea
- Go to **Authentication** → **URL Configuration**

### 2. Add Site URLs
Add these URLs in the **Site URL** field:
```
sidequest://auth/callback
```

### 3. Add Redirect URLs
Add these URLs in the **Redirect URLs** field:
```
sidequest://auth/callback
exp://localhost:8081/--/auth/callback
exp://100.64.128.217:8081/--/auth/callback
exp://192.168.*:8081/--/auth/callback
http://localhost:8081/auth/callback
```

## 🔍 Why these URLs?

- `sidequest://auth/callback` - For production app with custom scheme
- `exp://localhost:8081/--/auth/callback` - For Expo Go development on localhost
- `exp://100.64.128.217:8081/--/auth/callback` - For your specific development IP
- `exp://192.168.*:8081/--/auth/callback` - For Expo Go development on local network
- `http://localhost:8081/auth/callback` - For web development

## 🚨 IMPORTANT: Add Your Exact IP

From your logs, I can see your development server is running at:
**`exp://100.64.128.217:8081/--/auth/callback`**

Make sure to add this EXACT URL to your Supabase redirect URLs!

## ✅ Steps to Fix:

1. **Go to Supabase Dashboard** → Authentication → URL Configuration
2. **Add this exact URL** to Redirect URLs:
   ```
   exp://100.64.128.217:8081/--/auth/callback
   ```
3. **Save the configuration**
4. **Test Google sign-in again**

## 🎯 What Should Happen:

1. Click "Sign in with Google" ✅ (working)
2. OAuth URL generated ✅ (working)
3. Browser opens Google auth ✅ (should work)
4. After auth, redirects to your app ✅ (will work after URL config)
5. App completes sign-in process ✅

The OAuth flow is working correctly - you just need to add the exact redirect URL to Supabase! 🚀 