#!/usr/bin/env node

// Test Supabase OAuth configuration
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function testSupabaseOAuth() {
  console.log('🔍 Testing Supabase OAuth Configuration...\n');

  try {
    // Load environment
    const envContent = fs.readFileSync('.env', 'utf8');
    const urlMatch = envContent.match(/SUPABASE_URL=(.+)/);
    const keyMatch = envContent.match(/SUPABASE_ANON_KEY=(.+)/);
    
    if (!urlMatch || !keyMatch) {
      throw new Error('Missing Supabase credentials');
    }

    const supabaseUrl = urlMatch[1].trim();
    const supabaseKey = keyMatch[1].trim();

    console.log('✅ Supabase credentials loaded');
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created');

    // Test OAuth URL generation
    console.log('🔄 Testing OAuth URL generation...');
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'sidequest://auth/callback',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('❌ OAuth URL generation failed:', error);
      console.log('\n🚨 Possible Issues:');
      console.log('• Google OAuth provider not enabled in Supabase');
      console.log('• Invalid Client ID/Secret in Supabase');
      console.log('• Supabase project configuration issue');
      return;
    }

    if (data?.url) {
      console.log('✅ OAuth URL generated successfully!');
      console.log('🔗 OAuth URL:', data.url.substring(0, 100) + '...');
      console.log('\n✅ Supabase OAuth configuration is working!');
      console.log('\n📱 If sign-in still fails, check:');
      console.log('• WebBrowser implementation in your app');
      console.log('• Network connectivity on device');
      console.log('• Console logs during sign-in process');
    } else {
      console.log('❌ No OAuth URL returned (unexpected)');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Check:');
    console.log('• Supabase credentials in .env file');
    console.log('• Google OAuth provider configuration');
  }
}

testSupabaseOAuth();
