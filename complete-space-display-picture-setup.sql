-- Complete setup for space display pictures
-- This includes both database schema changes and storage bucket creation

-- 1. Add display_picture column to friend_circles table
ALTER TABLE friend_circles 
ADD COLUMN IF NOT EXISTS display_picture TEXT;

-- 2. Create space-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'space-images',
  'space-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- 3. Create RLS policies for space-images bucket
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

-- 4. Update the createCircle function to accept display_picture parameter
CREATE OR REPLACE FUNCTION create_circle_with_picture(
  circle_name TEXT,
  circle_description TEXT DEFAULT NULL,
  circle_display_picture TEXT DEFAULT NULL,
  user_id_param UUID DEFAULT auth.uid()
) RETURNS friend_circles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_circle friend_circles;
  circle_code TEXT;
  attempts INTEGER := 0;
  max_attempts INTEGER := 10;
BEGIN
  -- Generate unique code with collision detection
  LOOP
    circle_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    attempts := attempts + 1;
    
    -- Check if code already exists
    IF NOT EXISTS (SELECT 1 FROM friend_circles WHERE code = circle_code AND is_active = true) THEN
      EXIT; -- Code is unique
    END IF;
    
    IF attempts >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique circle code after % attempts', max_attempts;
    END IF;
  END LOOP;
  
  -- Create the circle
  INSERT INTO friend_circles (name, code, description, display_picture, created_by)
  VALUES (circle_name, circle_code, circle_description, circle_display_picture, user_id_param)
  RETURNING * INTO new_circle;
  
  -- Add creator as first member
  PERFORM add_member_to_circle(new_circle.id, user_id_param);
  
  RETURN new_circle;
END;
$$;
