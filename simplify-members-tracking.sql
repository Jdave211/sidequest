-- Simplify members tracking by adding member_ids array to friend_circles table

-- 1. Add member_ids array column to friend_circles
ALTER TABLE friend_circles 
ADD COLUMN member_ids UUID[] DEFAULT '{}';

-- 2. Populate existing circles with their current members
UPDATE friend_circles 
SET member_ids = (
  SELECT ARRAY_AGG(user_id) 
  FROM circle_members 
  WHERE circle_id = friend_circles.id 
    AND is_active = true
);

-- 3. Create function to add member to circle
CREATE OR REPLACE FUNCTION public.add_member_to_circle(circle_id_param UUID, user_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Add to member_ids array
  UPDATE public.friend_circles 
  SET member_ids = array_append(member_ids, user_id_param)
  WHERE id = circle_id_param;
  
  -- Also add to circle_members table for existing functionality
  INSERT INTO public.circle_members (circle_id, user_id, role)
  VALUES (circle_id_param, user_id_param, 'member')
  ON CONFLICT (circle_id, user_id) DO NOTHING;
END;
$$;

-- 4. Create function to remove member from circle
CREATE OR REPLACE FUNCTION public.remove_member_from_circle(circle_id_param UUID, user_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Remove from member_ids array
  UPDATE public.friend_circles 
  SET member_ids = array_remove(member_ids, user_id_param)
  WHERE id = circle_id_param;
  
  -- Also remove from circle_members table
  DELETE FROM public.circle_members 
  WHERE circle_id = circle_id_param AND user_id = user_id_param;
END;
$$;

-- 5. Create function to get circle members with user details
CREATE OR REPLACE FUNCTION public.get_circle_members(circle_id_param UUID)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.display_name,
    u.avatar_url,
    CASE 
      WHEN u.id = fc.created_by THEN 'creator'
      WHEN cm.role = 'admin' THEN 'admin'
      ELSE 'member'
    END as role
  FROM public.friend_circles fc
  CROSS JOIN UNNEST(fc.member_ids) as member_id
  LEFT JOIN public.users u ON u.id = member_id
  LEFT JOIN public.circle_members cm ON cm.circle_id = fc.id AND cm.user_id = u.id
  WHERE fc.id = circle_id_param;
END;
$$;

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION public.add_member_to_circle(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_member_from_circle(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_circle_members(UUID) TO authenticated;

-- 7. Update existing triggers to maintain member_ids array
CREATE OR REPLACE FUNCTION public.handle_new_circle()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Add creator to member_ids array
  NEW.member_ids = ARRAY[NEW.created_by];
  
  -- Also add to circle_members table
  INSERT INTO public.circle_members (circle_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  
  RETURN NEW;
END;
$$;

-- 8. Create trigger for member changes
CREATE OR REPLACE FUNCTION public.handle_member_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Add member to array
    UPDATE public.friend_circles 
    SET member_ids = array_append(member_ids, NEW.user_id)
    WHERE id = NEW.circle_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Remove member from array
    UPDATE public.friend_circles 
    SET member_ids = array_remove(member_ids, OLD.user_id)
    WHERE id = OLD.circle_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 9. Create trigger
DROP TRIGGER IF EXISTS trigger_handle_member_change ON circle_members;
CREATE TRIGGER trigger_handle_member_change
  AFTER INSERT OR DELETE ON circle_members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_member_change();
