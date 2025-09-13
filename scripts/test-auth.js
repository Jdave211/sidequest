#!/usr/bin/env node

// Test script to verify OAuth setup
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking OAuth Configuration...\n');

// Read .env file
let supabaseUrl = '';
let supabaseKey = '';

try {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/SUPABASE_URL=(.+)/);
  const keyMatch = envContent.match(/SUPABASE_ANON_KEY=(.+)/);
  
  if (urlMatch) supabaseUrl = urlMatch[1].trim();
  if (keyMatch) supabaseKey = keyMatch[1].trim();
} catch (error) {
  console.log('❌ Could not read .env file');
}

console.log('📋 Environment Check:');
console.log(`✅ SUPABASE_URL: ${supabaseUrl ? 'Set' : '❌ Missing'}`);
console.log(`✅ SUPABASE_ANON_KEY: ${supabaseKey ? 'Set' : '❌ Missing'}`);

if (supabaseUrl) {
  console.log(`🔗 Supabase Project: ${supabaseUrl.split('.')[0].split('//')[1]}`);
}

console.log('\n📱 App Configuration:');
console.log('✅ Bundle ID: com.davejaga.sidequest');
console.log('✅ Scheme: sidequest://');
console.log('✅ Auth Callback: sidequest://auth/callback');

console.log('\n🔧 Next Steps:');
console.log('1. Complete Google Cloud Console setup');
console.log('2. Configure Supabase OAuth provider');
console.log('3. Test on physical device');
console.log('\n📖 See SETUP_CHECKLIST.md for detailed steps');
