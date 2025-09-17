-- Fix RLS policies for space-images bucket
-- This ensures authenticated users can upload space images

-- First, ensure the bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'space-images',
  'space-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Space images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload space images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own space images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own space images" ON storage.objects;

-- Create new RLS policies for space-images bucket
CREATE POLICY "Space images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'space-images');

CREATE POLICY "Authenticated users can upload space images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'space-images'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own space images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'space-images'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own space images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'space-images'
  AND auth.role() = 'authenticated'
);

-- Also ensure the sidequest-images bucket has proper policies
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sidequest-images',
  'sidequest-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Drop existing policies for sidequest-images if they exist
DROP POLICY IF EXISTS "Sidequest images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload sidequest images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own sidequest images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own sidequest images" ON storage.objects;

-- Create new RLS policies for sidequest-images bucket
CREATE POLICY "Sidequest images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'sidequest-images');

CREATE POLICY "Authenticated users can upload sidequest images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'sidequest-images'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own sidequest images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'sidequest-images'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own sidequest images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'sidequest-images'
  AND auth.role() = 'authenticated'
);
