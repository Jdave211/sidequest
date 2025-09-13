# 🛠️ Create Users Table in Supabase

## 🚨 Issue Found!
The sign-in process hangs because the `users` table doesn't exist in your Supabase database.

## ✅ Solution: Create the Users Table

### Step 1: Go to Supabase SQL Editor
1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/mwzeumckccvkrsmixsea)
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run This SQL Command
Copy and paste this SQL into the editor and click **Run**:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read and write their own data
CREATE POLICY "Users can manage their own profile" ON users
  FOR ALL USING (auth.uid() = id);

-- Create policy to allow users to read other users' basic info (for social features)
CREATE POLICY "Users can read other users' basic info" ON users
  FOR SELECT USING (true);
```

### Step 3: Verify Table Creation
After running the SQL, you should see:
- ✅ `users` table created
- ✅ Row Level Security enabled
- ✅ Policies created for data access

### Step 4: Test Your Sign-In Again
1. Go back to your app
2. Try signing in with Google
3. You should now see these logs:
   ```
   🔍 Checking if user profile exists in database...
   🆕 New user detected, creating profile...
   📝 Inserting new user profile: {...}
   ✅ User profile created successfully: Your Name
   ✅ User session processing completed successfully!
   🎉 User is now signed in: your@email.com
   ```

## 🎯 What This Fixes

### Before (Hanging):
- OAuth completes successfully ✅
- Session created in Supabase ✅
- App tries to query users table ❌ (table doesn't exist)
- Database query hangs indefinitely ❌
- Loading spinner never stops ❌

### After (Working):
- OAuth completes successfully ✅
- Session created in Supabase ✅
- App queries users table ✅
- Creates user profile ✅
- Sets auth state ✅
- User signed in and navigated to app ✅

## 🚨 If You Want All Tables
If you want to create all the tables for your social features, run the complete schema from `supabase-schema.sql`:

1. Copy the entire contents of `supabase-schema.sql`
2. Paste into Supabase SQL Editor
3. Click **Run**

This will create:
- `users` table (required for auth)
- `friend_circles` table (for social features)
- `circle_members` table (for social features)
- `social_sidequests` table (for social features)
- `sidequest_activities` table (for activity feeds)

## 🎉 Ready to Sign In!
Once you create the users table, your Google sign-in will work perfectly!
