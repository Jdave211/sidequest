# Environment Variables Setup

## Security First! 🔒

Your Supabase credentials should never be committed to version control. This guide shows you how to set them up securely.

## Setup Steps

### 1. Create your .env file

```bash
cp env.example .env
```

### 2. Get your Supabase credentials

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** > **API**
4. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **Anon/Public Key** (starts with `eyJ...`)

### 3. Update your .env file

Edit the `.env` file with your actual values:

```env
SUPABASE_URL=https://your-actual-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-anon-key-here
```

### 4. Restart your development server

```bash
npx expo start --clear
```

## How it works

- The `.env` file is ignored by git (check `.gitignore`)
- Environment variables are loaded through `app.config.js`
- The app accesses them securely via `expo-constants`
- The app will throw an error if credentials are missing

## Important Notes

- ✅ The **anon key** is safe to use in client-side code
- ❌ Never commit your `.env` file to version control
- ✅ The `env.example` file shows the format without real credentials
- ✅ Each team member needs their own `.env` file

## Team Setup

When sharing this project:
1. Share the `env.example` file
2. Each person creates their own `.env` file
3. Everyone uses the same Supabase project credentials 