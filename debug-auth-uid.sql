-- Debug auth.uid() and user authentication state
-- Run this in Supabase SQL Editor while signed in to your app

SELECT 
  'Current auth.uid()' as check_type,
  auth.uid() as result,
  CASE 
    WHEN auth.uid() IS NULL THEN 'ERROR: auth.uid() is NULL - user not authenticated at DB level'
    ELSE 'OK: User is authenticated'
  END as status;

-- Check if the user exists in auth.users
SELECT 
  'User exists in auth.users' as check_type,
  id as result,
  CASE 
    WHEN id IS NOT NULL THEN 'OK: User found in auth.users'
    ELSE 'ERROR: User not found in auth.users'
  END as status
FROM auth.users 
WHERE id = 'bd49cf86-8f01-456e-b8f0-f259909cdab0'::uuid;

-- Check if the user exists in public.users
SELECT 
  'User exists in public.users' as check_type,
  id as result,
  CASE 
    WHEN id IS NOT NULL THEN 'OK: User found in public.users'
    ELSE 'ERROR: User not found in public.users'
  END as status
FROM public.users 
WHERE id = 'bd49cf86-8f01-456e-b8f0-f259909cdab0'::uuid;

-- Test the INSERT policy directly
SELECT 
  'INSERT policy test' as check_type,
  CASE 
    WHEN auth.uid() = 'bd49cf86-8f01-456e-b8f0-f259909cdab0'::uuid THEN 'OK: Policy should allow INSERT'
    WHEN auth.uid() IS NULL THEN 'ERROR: auth.uid() is NULL, policy will block'
    ELSE 'ERROR: auth.uid() mismatch, policy will block'
  END as result,
  auth.uid() as current_auth_uid;
