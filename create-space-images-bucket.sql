-- Create space-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'space-images',
  'space-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for space-images bucket
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
