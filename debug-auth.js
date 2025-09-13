#!/usr/bin/env node

// Debug script for Google OAuth issues
const fs = require('fs');

console.log('🔍 Debugging Google OAuth Setup...\n');

// Check environment
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/SUPABASE_URL=(.+)/);
  const keyMatch = envContent.match(/SUPABASE_ANON_KEY=(.+)/);
  
  console.log('📋 Environment Check:');
  console.log(`✅ SUPABASE_URL: ${urlMatch ? 'Set' : '❌ Missing'}`);
  console.log(`✅ SUPABASE_ANON_KEY: ${keyMatch ? 'Set' : '❌ Missing'}`);
  
  if (urlMatch) {
    const projectId = urlMatch[1].split('.')[0].replace('https://', '');
    console.log(`🔗 Supabase Project ID: ${projectId}`);
  }
} catch (error) {
  console.log('❌ Could not read .env file');
}

// Check Google credentials
try {
  const googleKeys = fs.readFileSync('google keys', 'utf8');
  console.log('\n🔑 Google OAuth Credentials:');
  console.log(`✅ Google credentials file found`);
  
  const clientIdMatch = googleKeys.match(/Client iD - (.+)/);
  const secretMatch = googleKeys.match(/Client Secret - (.+)/);
  
  if (clientIdMatch) {
    console.log(`✅ Client ID: ${clientIdMatch[1].substring(0, 20)}...`);
  }
  if (secretMatch) {
    console.log(`✅ Client Secret: ${secretMatch[1].substring(0, 10)}...`);
  }
} catch (error) {
  console.log('\n❌ Could not read google keys file');
}

console.log('\n🔧 Troubleshooting Steps:');
console.log('1. ✅ Google credentials found');
console.log('2. ❓ Are these credentials configured in Supabase?');
console.log('   → Go to: https://supabase.com/dashboard/project/mwzeumckccvkrsmixsea/auth/providers');
console.log('   → Enable Google provider');
console.log('   → Add your Client ID and Secret');
console.log('');
console.log('3. ❓ Are redirect URLs configured?');
console.log('   → Go to: https://supabase.com/dashboard/project/mwzeumckccvkrsmixsea/auth/url-configuration');
console.log('   → Add: sidequest://auth/callback');
console.log('');
console.log('4. ❓ Is Google Cloud Console configured?');
console.log('   → Redirect URI: https://mwzeumckccvkrsmixsea.supabase.co/auth/v1/callback');

console.log('\n🚨 Common Issues:');
console.log('• Client ID/Secret mismatch between Google Console and Supabase');
console.log('• Google OAuth provider not enabled in Supabase');
console.log('• Incorrect redirect URI in Google Cloud Console');
console.log('• Network connectivity issues');

console.log('\n📱 Next Steps:');
console.log('1. Check Supabase dashboard configuration');
console.log('2. Test sign-in and check console logs');
console.log('3. Look for specific error messages');
