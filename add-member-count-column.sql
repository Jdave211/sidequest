-- Add member_count column to friend_circles table
-- This will track the number of active members in each circle

-- 1. Add the member_count column
ALTER TABLE friend_circles 
ADD COLUMN member_count INTEGER DEFAULT 1 NOT NULL;

-- 2. Update existing circles with their current member count
UPDATE friend_circles 
SET member_count = (
  SELECT COUNT(*) 
  FROM circle_members 
  WHERE circle_id = friend_circles.id 
    AND is_active = true
);

-- 3. Create a function to update member count when members join/leave
CREATE OR REPLACE FUNCTION public.update_circle_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update member count for the affected circle
  UPDATE public.friend_circles 
  SET member_count = (
    SELECT COUNT(*) 
    FROM public.circle_members 
    WHERE circle_id = COALESCE(NEW.circle_id, OLD.circle_id)
      AND is_active = true
  )
  WHERE id = COALESCE(NEW.circle_id, OLD.circle_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 4. Create triggers to automatically update member count
-- Trigger for INSERT (when someone joins)
CREATE TRIGGER trigger_update_member_count_on_insert
  AFTER INSERT ON public.circle_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_circle_member_count();

-- Trigger for UPDATE (when someone's status changes)
CREATE TRIGGER trigger_update_member_count_on_update
  AFTER UPDATE ON public.circle_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_circle_member_count();

-- Trigger for DELETE (when someone leaves)
CREATE TRIGGER trigger_update_member_count_on_delete
  AFTER DELETE ON public.circle_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_circle_member_count();

-- 5. Add index for better performance on member_count queries
CREATE INDEX IF NOT EXISTS idx_friend_circles_member_count ON friend_circles(member_count);

-- 6. Update the find_circle_by_code function to include member_count
-- First drop the existing function
DROP FUNCTION IF EXISTS public.find_circle_by_code(TEXT);

-- Then recreate it with the new return type
CREATE FUNCTION public.find_circle_by_code(circle_code TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  code TEXT,
  description TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_active BOOLEAN,
  max_members INTEGER,
  member_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fc.id,
    fc.name,
    fc.code,
    fc.description,
    fc.created_by,
    fc.created_at,
    fc.updated_at,
    fc.is_active,
    fc.max_members,
    fc.member_count
  FROM public.friend_circles fc
  WHERE fc.code = circle_code 
    AND fc.is_active = true;
END;
$$;
