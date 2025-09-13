# 🔐 Complete Google OAuth Setup Guide for Supabase

## 📋 Overview
This guide will walk you through setting up Google OAuth authentication for your Sidequest app using Supabase.

## 🎯 Step 1: Google Cloud Console Setup

### 1.1 Create/Select Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
   - Project name: `Sidequest App` (or your preferred name)
   - Note down your Project ID

### 1.2 Enable Google+ API
1. Go to **APIs & Services** > **Library**
2. Search for "Google+ API" 
3. Click **Enable**

### 1.3 Configure OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** (unless you have Google Workspace)
3. Fill in required fields:
   - **App name**: `Sidequest`
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Add scopes (optional for basic auth):
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
5. Save and continue

### 1.4 Create OAuth 2.0 Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**

#### For Web Application:
- **Application type**: Web application
- **Name**: `Sidequest Web`
- **Authorized redirect URIs**: 
  ```
  https://mwzeumckccvkrsmixsea.supabase.co/auth/v1/callback
  ```

#### For iOS (if building standalone):
- **Application type**: iOS
- **Name**: `Sidequest iOS`
- **Bundle ID**: `com.yourcompany.sidequest` (update this to your actual bundle ID)

#### For Android (if building standalone):
- **Application type**: Android
- **Name**: `Sidequest Android`
- **Package name**: `com.yourcompany.sidequest`
- **SHA-1 certificate fingerprint**: (get this from your keystore)

## 🗂️ Step 2: Supabase Configuration

### 2.1 Configure Google OAuth in Supabase
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/mwzeumckccvkrsmixsea)
2. Navigate to **Authentication** > **Providers**
3. Find **Google** and click **Configure**
4. Enable Google provider
5. Add your Google OAuth credentials:
   - **Client ID**: Copy from Google Cloud Console (Web application client ID)
   - **Client Secret**: Copy from Google Cloud Console (Web application client secret)

### 2.2 Configure Redirect URLs
1. In Supabase Dashboard, go to **Authentication** > **URL Configuration**
2. Add these URLs to **Redirect URLs**:
   ```
   sidequest://auth/callback
   exp://localhost:8081/--/auth/callback
   http://localhost:8081/auth/callback
   https://localhost:8081/auth/callback
   ```

### 2.3 Update Site URL
Set **Site URL** to:
```
sidequest://
```

## 📱 Step 3: Update App Configuration

### 3.1 Update Bundle Identifiers
Update your `app.config.js` with proper bundle identifiers:
